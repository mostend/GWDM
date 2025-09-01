package commander

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type CommanderService struct{}

func NewCommanderService() *CommanderService {
	return &CommanderService{}
}

type Script struct {
	ScriptName        string      `json:"ScriptName"`
	ScriptDescription string      `json:"ScriptDescription"`
	Command           string      `json:"Command"`
	WaitingFor        string      `json:"WaitingFor"`
	Interrupt         string      `json:"Interrupt"`
	GoOnCommand       string      `json:"GoOnCommand"`
	Parameter         []Parameter `json:"Parameter"`
}

type Parameter struct {
	ParameterDescription    string `json:"ParameterDescription"`
	ParameterValue          string `json:"ParameterValue"`
	ParameterReferenceValue any    `json:"ParameterReferenceValue"`
}

func (s *CommanderService) GetScriptsList(folder string) (scriptsList []string) {
	files, err := os.ReadDir(folder)
	if err != nil {
		dialog := application.ErrorDialog()
		dialog.SetTitle("Error")
		dialog.SetMessage(fmt.Sprintf("Failed to read script folder! Folder:%s, Error: %s", folder, err))
		dialog.Show()
		return []string{}
	}
	for _, file := range files {
		if file.IsDir() {
			// 递归处理子目录中的文件，但不直接添加目录本身
			subScripts := s.GetScriptsList(folder + "/" + file.Name())
			for _, subScript := range subScripts {
				// 构建相对于主目录的路径
				scriptsList = append(scriptsList, file.Name()+"/"+subScript)
			}
		} else {
			scriptsList = append(scriptsList, file.Name())
		}
	}
	return
}

func (s *CommanderService) GetScriptContent(scriptPath string) (script Script) {
	// 直接使用完整路径读取文件
	bytes, err := os.ReadFile(scriptPath)
	if err != nil {
		dialog := application.ErrorDialog()
		dialog.SetTitle("Error")
		dialog.SetMessage(fmt.Sprintf("Failed to read script file! File:%s, Error: %s", scriptPath, err))
		dialog.Show()
		return Script{}
	}
	err = json.Unmarshal(bytes, &script)
	if err != nil {
		dialog := application.ErrorDialog()
		dialog.SetTitle("Error")
		dialog.SetMessage(fmt.Sprintf("Failed to parse script file! File:%s, Error: %s", scriptPath, err))
		dialog.Show()
		return Script{}
	}
	// 保存完整路径
	script.ScriptName = scriptPath
	return script
}

func (s *CommanderService) Run(sshService *SSHService) {
	sshService.Timeout = 0
	_, err := sshService.ExecuteCommands(sshService.Scripts)

	if err != nil {
		app := application.Get()
		app.Event.Emit("result", err.Error())
	}
}

func (s *CommanderService) SelectFolder() string {
	diglog := application.OpenFileDialog()
	diglog.SetTitle("Select Script Folder")
	diglog.CanChooseDirectories(true)
	diglog.CanChooseFiles(false)
	diglog.CanCreateDirectories(false)
	folder, err := diglog.PromptForSingleSelection()
	if err != nil {
		application.Get().Logger.Error("Failed to open folder dialog", "error", err)
		return ""
	}
	return folder
}
