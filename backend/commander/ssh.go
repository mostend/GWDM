package commander

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"
)

type SSHService struct {
	IP       string
	Port     int
	UserName string
	Password string
	Scripts  []string
	Timeout  time.Duration // Timeout for SSH operations
}

type commandResult struct {
	output string
	err    error
}

type shellRunner struct {
	writer   io.Writer
	outputCh <-chan commandResult
	timeout  time.Duration
}

func newShellRunner(w io.Writer, r io.Reader, timeout time.Duration, onChunk func(string)) *shellRunner {
	outputCh := make(chan commandResult, 1)
	go streamShellOutput(r, outputCh, onChunk)

	return &shellRunner{
		writer:   w,
		outputCh: outputCh,
		timeout:  timeout,
	}
}

func (r *shellRunner) bootstrap() error {
	_, err := r.readUntilPrompt()
	return err
}

func (r *shellRunner) execute(command string) (string, error) {
	if _, err := fmt.Fprintf(r.writer, "%s\n", command); err != nil {
		return "", err
	}

	return r.readUntilPrompt()
}

func (r *shellRunner) readUntilPrompt() (string, error) {
	select {
	case result, ok := <-r.outputCh:
		if !ok {
			return "", io.EOF
		}
		return result.output, result.err
	case <-time.After(r.timeout):
		return "", fmt.Errorf("command timed out after %s", r.timeout)
	}
}

func streamShellOutput(reader io.Reader, outputCh chan<- commandResult, onChunk func(string)) {
	defer close(outputCh)

	bufferedReader := bufio.NewReader(reader)
	var output strings.Builder
	var chunk strings.Builder

	for {
		b, err := bufferedReader.ReadByte()
		if err != nil {
			if chunk.Len() > 0 && onChunk != nil {
				onChunk(chunk.String())
			}
			if errors.Is(err, io.EOF) && output.Len() > 0 {
				outputCh <- commandResult{output: strings.TrimRight(output.String(), "\r\n")}
			}
			if !errors.Is(err, io.EOF) {
				outputCh <- commandResult{err: err}
			}
			return
		}

		output.WriteByte(b)
		chunk.WriteByte(b)
		if b == '\n' {
			if onChunk != nil {
				onChunk(chunk.String())
			}
			chunk.Reset()
		}
		if hasShellPrompt(output.String()) {
			if chunk.Len() > 0 && onChunk != nil {
				onChunk(chunk.String())
				chunk.Reset()
			}
			outputCh <- commandResult{output: strings.TrimRight(output.String(), "\r\n")}
			output.Reset()
		}
	}
}

func hasShellPrompt(output string) bool {
	trimmed := strings.TrimRight(output, "\r\n")
	return strings.HasSuffix(trimmed, "#") ||
		strings.HasSuffix(trimmed, "$") ||
		strings.HasSuffix(trimmed, ">")
}

var knownHostsMu sync.Mutex

func knownHostsFiles() ([]string, string, error) {
	if strings.EqualFold(os.Getenv("GWDM_INSECURE_IGNORE_HOST_KEY"), "true") {
		return nil, "", nil
	}

	var candidates []string
	var writablePath string
	if customPath := strings.TrimSpace(os.Getenv("SSH_KNOWN_HOSTS")); customPath != "" {
		candidates = append(candidates, customPath)
		writablePath = customPath
	}

	homeDir, err := os.UserHomeDir()
	if err == nil && homeDir != "" {
		userKnownHosts := filepath.Join(homeDir, ".ssh", "known_hosts")
		candidates = append(candidates, userKnownHosts)
		if writablePath == "" {
			writablePath = userKnownHosts
		}
	}
	candidates = append(candidates, "/etc/ssh/ssh_known_hosts")

	knownHostsFiles := make([]string, 0, len(candidates))
	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}
		if _, err := os.Stat(candidate); err == nil {
			knownHostsFiles = append(knownHostsFiles, candidate)
		}
	}

	if writablePath == "" {
		return nil, "", errors.New("unable to determine a writable known_hosts path")
	}

	return knownHostsFiles, writablePath, nil
}

func ensureKnownHostEntry(path, hostname string, remote net.Addr, key ssh.PublicKey) error {
	knownHostsMu.Lock()
	defer knownHostsMu.Unlock()

	host, port, err := net.SplitHostPort(remote.String())
	if err != nil {
		host = hostname
		port = "22"
	}

	normalizedHosts := []string{hostname}
	if host != "" && host != hostname {
		normalizedHosts = append(normalizedHosts, host)
	}
	if port != "" && port != "22" {
		normalizedHosts = append(normalizedHosts, knownhosts.Normalize(fmt.Sprintf("[%s]:%s", host, port)))
	}

	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}

	file, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer file.Close()

	line := knownhosts.Line(normalizedHosts, key)
	if _, err := fmt.Fprintln(file, line); err != nil {
		return err
	}

	return nil
}

func hostKeyCallback() (ssh.HostKeyCallback, error) {
	if strings.EqualFold(os.Getenv("GWDM_INSECURE_IGNORE_HOST_KEY"), "true") {
		return ssh.InsecureIgnoreHostKey(), nil
	}

	files, writablePath, err := knownHostsFiles()
	if err != nil {
		return nil, err
	}

	buildCallback := func() (ssh.HostKeyCallback, error) {
		if len(files) == 0 {
			if err := os.MkdirAll(filepath.Dir(writablePath), 0700); err != nil {
				return nil, err
			}
			file, err := os.OpenFile(writablePath, os.O_CREATE, 0600)
			if err != nil {
				return nil, err
			}
			file.Close()
			files = append(files, writablePath)
		}
		return knownhosts.New(files...)
	}

	callback, err := buildCallback()
	if err != nil {
		return nil, err
	}

	return func(hostname string, remote net.Addr, key ssh.PublicKey) error {
		err := callback(hostname, remote, key)
		if err == nil {
			return nil
		}

		var keyErr *knownhosts.KeyError
		if errors.As(err, &keyErr) && len(keyErr.Want) == 0 {
			if appendErr := ensureKnownHostEntry(writablePath, hostname, remote, key); appendErr != nil {
				return fmt.Errorf("failed to trust host %s: %w", hostname, appendErr)
			}

			callback, err = buildCallback()
			if err != nil {
				return err
			}

			return callback(hostname, remote, key)
		}

		return err
	}, nil
}

// Connect establishes an SSH connection to the specified server
func (s *SSHService) Connect() (*ssh.Client, error) {
	// Set default timeout if not specified
	timeout := s.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second // Default timeout
	}
	callback, err := hostKeyCallback()
	if err != nil {
		return nil, err
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
		HostKeyCallback: callback,
		Timeout:         timeout,
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
	sequence := 0
	emitChunk := func(text string) {
		if text == "" {
			return
		}
		app.Event.Emit("result_chunk", map[string]any{
			"seq":  sequence,
			"text": text,
		})
		sequence++
	}

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

	runner := newShellRunner(w, r, timeout, emitChunk)

	if err := session.Shell(); err != nil {
		return nil, fmt.Errorf("unable to start shell: %w", err)
	}

	if err := runner.bootstrap(); err != nil {
		return nil, fmt.Errorf("unable to initialize remote shell: %w", err)
	}

	results := make([]string, 0, len(commands))

	for _, cmd := range commands {
		outResult, err := runner.execute(cmd)
		results = append(results, outResult)

		if err != nil {
			emitChunk(err.Error() + "\r\n")
			return results, err
		}

		time.Sleep(500 * time.Millisecond)
	}

	if _, err := fmt.Fprintln(w, "exit"); err != nil {
		return results, fmt.Errorf("unable to close remote shell: %w", err)
	}

	emitChunk("finished\r\n")
	if err := session.Wait(); err != nil && !strings.Contains(err.Error(), "exit status") {
		return results, fmt.Errorf("remote shell exited unexpectedly: %w", err)
	}

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
