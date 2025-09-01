package commander

import (
	"fmt"
	"io"
	"net"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/crypto/ssh"
)

type SSHService struct {
	IP       string
	Port     int
	UserName string
	Password string
	Scripts  []string
	Timeout  time.Duration // Timeout for SSH operations
}

// MuxShell handles multiplexing of shell commands over SSH with timeout support
func MuxShell(w io.Writer, r io.Reader, timeout time.Duration) (chan<- string, <-chan string) {
	in := make(chan string, 1)
	out := make(chan string, 1)
	var wg sync.WaitGroup
	wg.Add(1) // for the shell itself

	// Use a mutex to protect channel operations
	var mu sync.Mutex
	channelClosed := false

	// Safe send function to prevent sending on closed channel
	safeSend := func(msg string) {
		mu.Lock()
		defer mu.Unlock()
		if !channelClosed {
			out <- msg
		}
	}

	// Safe close function to prevent double close
	safeClose := func() {
		mu.Lock()
		defer mu.Unlock()
		if !channelClosed {
			channelClosed = true
			close(in)
			close(out)
		}
	}

	// Command sender goroutine
	go func() {
		for cmd := range in {
			wg.Add(1)
			w.Write([]byte(cmd + "\n"))

			// Create a timeout channel
			timeoutChan := time.After(timeout)

			// Wait for command completion or timeout
			done := make(chan struct{})
			go func() {
				wg.Wait()
				close(done)
			}()

			select {
			case <-done:
				// Command completed normally
			case <-timeoutChan:
				// Command timed out - use safe send
				safeSend("Command timed out after " + timeout.String())
				wg.Done() // Release the wait to allow next command
			}
		}
	}()

	// Output reader goroutine
	go func() {
		var (
			buf [65 * 1024]byte
			t   int
		)
		for {
			n, err := r.Read(buf[t:])
			if err != nil {
				safeClose()
				return
			}
			t += n

			// Check for different prompts based on user (root or regular)
			output := string(buf[:t])
			if strings.HasSuffix(output, "# ") || // root prompt
				strings.HasSuffix(output, "$ ") || // regular user prompt
				strings.HasSuffix(output, "> ") { // alternative prompt
				safeSend(output)
				t = 0
				wg.Done()
			}
		}
	}()

	return in, out
}

// isRootPrompt checks if the output ends with a root prompt
func isRootPrompt(output string) bool {
	// output最后5个字符含有#就说明在root下，返回true
	return strings.HasSuffix(output, "# ")
}

// Connect establishes an SSH connection to the specified server
func (s *SSHService) Connect() (*ssh.Client, error) {
	// Set default timeout if not specified
	timeout := s.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second // Default timeout
	}
	config := &ssh.ClientConfig{
		User: s.UserName,
		Auth: []ssh.AuthMethod{
			ssh.KeyboardInteractive(func(user, instruction string, questions []string, echos []bool) ([]string, error) {
				answers := make([]string, len(questions))
				for i, v := range answers {
					_ = v
					answers[i] = s.Password
				}
				return answers, nil
			}),
			ssh.Password(s.Password),
		},
		HostKeyCallback: func(hostname string, remote net.Addr, key ssh.PublicKey) error {
			return nil
		},
	}

	addr := fmt.Sprintf("%s:%d", s.IP, s.Port)
	client, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to SSH server: %w", err)
	}

	return client, nil
}

// ExecuteCommands connects to the SSH server and executes multiple commands in sequence
func (s *SSHService) ExecuteCommands(commands []string) ([]string, error) {

	s.OpenCommanderResultWindow()
	app := application.Get()

	// Set default timeout if not specified
	timeout := s.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second // Default timeout
	}

	client, err := s.Connect()
	if err != nil {
		return nil, err
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return nil, fmt.Errorf("unable to create session: %w", err)
	}
	defer session.Close()

	modes := ssh.TerminalModes{
		ssh.ECHO:          1,     // disable echoing
		ssh.TTY_OP_ISPEED: 14400, // input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // output speed = 14.4kbaud
	}

	if err := session.RequestPty("xterm", 80, 40, modes); err != nil {
		return nil, fmt.Errorf("request for pseudo terminal failed: %w", err)
	}

	w, err := session.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("unable to get stdin pipe: %w", err)
	}

	r, err := session.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("unable to get stdout pipe: %w", err)
	}

	in, out := MuxShell(w, r, timeout)

	if err := session.Shell(); err != nil {
		return nil, fmt.Errorf("unable to start shell: %w", err)
	}

	outResult := <-out
	// ignore the initial shell output
	app.Event.Emit("result", outResult)

	results := make([]string, 0, len(commands))
	var lastResult string

	for _, cmd := range commands {
		in <- cmd
		time.Sleep(100 * time.Millisecond) // Small delay to ensure command is sent
		outResult := <-out

		app.Event.Emit("result", outResult)
		// log.Println(outResult)
		lastResult = outResult
	}

	defer func() {
		if r := recover(); r != nil {
			session.Wait()
			session.Close()
			client.Close()
			app.Event.Emit("result", "finished")
		}
	}()

	// Check if the last output indicates we're in a root environment
	if isRootPrompt(lastResult) {
		in <- "exit" // Exit from root shell
		outResult := <-out
		app.Event.Emit("result", outResult)
	}

	// Always exit from the main shell
	in <- "exit"
	app.Event.Emit("result", "finished")
	session.Wait()

	return results, nil
}

// Store the result window as a package-level variable to track its state
var resultWindow *application.WebviewWindow

func (s *SSHService) OpenCommanderResultWindow() {
	app := application.Get()
	// Close existing window if it exists
	if resultWindow != nil {
		resultWindow.Close()
	}
	// Create a new window
	resultWindow = app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:              "Result",
		Width:              1200,
		Height:             600,
		InitialPosition:    application.WindowCentered,
		DisableResize:      true,
		ZoomControlEnabled: true,
		EnableDragAndDrop:  true,
		CloseButtonState:   application.ButtonEnabled,
		// MaximiseButtonState: application.ButtonDisabled,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarDefault,
		},
		Windows: application.WindowsWindow{
			DisableIcon: true,
		},
		URL: "#/CommanderResult",
	})
	resultWindow.Show()
}
