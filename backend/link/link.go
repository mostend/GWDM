package link

import (
	"fmt"
	"os"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type LinkService struct{}

func NewLinkService() *LinkService {
	return &LinkService{}
}

func (l *LinkService) SaveFile(data string) {
	app := application.Get()
	fileName := fmt.Sprintf("link_data_%s.json", time.Now().Format("20060102_150405"))
	dialog := app.Dialog.SaveFile().SetFilename(fileName)

	filePath, err := dialog.PromptForSingleSelection()
	if err != nil {
		app.Logger.Error("Failed to save file", "error", err)
		return
	}
	if filePath == "" {
		return
	}

	// 打开文件，不管有没有内容直接创建或覆盖
	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		app.Logger.Error("Failed to open file", "error", err)
		return
	}
	defer file.Close()
	// 写入数据到文件
	_, err = file.WriteString(data)
	if err != nil {
		app.Logger.Error("Failed to write data to file", "error", err)
		return
	}
}

func (l *LinkService) UploadFile() string {
	app := application.Get()
	dialog := app.Dialog.OpenFile().SetTitle("Select Link Data File").AddFilter("JSON Files", "*.json")

	filePath, err := dialog.PromptForSingleSelection()
	if err != nil {
		app.Logger.Error("Failed to open file dialog", "error", err)
		return ""
	}

	if filePath == "" {
		return ""
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		app.Logger.Error("Failed to read file", "error", err)
		return ""
	}

	return string(data)
}
