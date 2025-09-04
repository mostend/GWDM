<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Events, Dialogs } from '@wailsio/runtime'
import { SelectFolder, GetScriptsList, GetScriptContent, Run } from '../../bindings/GWDM/backend/commander/commanderservice'
import { Notification, Modal } from '@arco-design/web-vue'


// 添加标志位防止重复调用
let isSelectingFolder = false

onMounted(() => {
    Notification.clear()
    Notification.warning({
        title: 'Warning',
        content: 'Please note! Commander does not support interactive commands!',
    })
})


const CommanderData = reactive({
    IP: '192.168.126.1',
    Port: 22,
    IsCustomerUser: false,
    IsRunDisabled: false,
    UserName: 'root',
    Password: 'sn5Lab@2JL',
    Folder: '',
    ScriptsList: [],
    CurrentScripts: [],
    Scripts: [],
    PostScripts: [],
})

// 添加一个ref来引用右侧脚本内容容器
const scriptsContainerRef = ref(null)

const IsCustomerUser = () => {
    if (!CommanderData.IsCustomerUser) {
        CommanderData.UserName = 'root'
        CommanderData.Password = 'sn5Lab@2JL'
        return
    }
    CommanderData.UserName = ''
    CommanderData.Password = ''
}

function GetFolder() {
    // 防止重复调用
    if (isSelectingFolder) return
    isSelectingFolder = true

    SelectFolder().then((folder) => {
        isSelectingFolder = false
        if (folder != "") {
            CommanderData.Folder = folder
            console.log("Selected folder:", folder)

            // 获取文件夹下的脚本列表
            GetScripts()
        }
        // 用户取消选择时不再显示错误提示
    }).catch((error) => {
        isSelectingFolder = false
        // 只有在真正出错时才显示错误提示，用户取消选择不提示
        if (error && !error.includes("cancel")) {
            Modal.error({
                title: 'Error',
                content: 'Failed to select folder!',
            })
        }
    })
}

const GetScripts = async () => {
    CommanderData.Scripts = []
    CommanderData.CurrentScripts = []
    CommanderData.ScriptsList = await GetScriptsList(CommanderData.Folder)
    for (let i = 0; i < CommanderData.ScriptsList.length; i++) {
        // 初始化每个脚本的启用状态为true
        CommanderData.CurrentScripts.push({
            id: i + 1,
            name: CommanderData.ScriptsList[i],
            enabled: false,
        })
    }
}

// 点击滚动
const Scroll = function (scriptName) {
    let sel = document.getElementById(scriptName)
    if (sel) {
        sel.scrollIntoView({
            behavior: 'smooth',
        })
    }
}

const DeleteFolder = () => {
    CommanderData.Folder = ''
    CommanderData.ScriptsList = []
    // 还要删除整个具体的脚本列表
    CommanderData.CurrentScripts = []
    CommanderData.Scripts = []
}

const GetCommand = function (currentScript) {
    let command = currentScript.Command
    if (command == "") {
        return false
    }
    if (currentScript.Parameter.length == 0) {
        return command
    }
    for (let i = 0; i < currentScript.Parameter.length; i++) {
        command = command.replace("%s", currentScript.Parameter[i].ParameterValue)
    }
    // 去除换行符
    command = command.replace(/(\r\n|\n|\r)/gm, "")
    return command
}

// 修改：添加处理脚本启用状态切换的函数
const handleScriptEnableChange = async (record) => {
    if (record.enabled) {
        // 传递完整路径给 GetScriptContent
        try {
            const fullPath = CommanderData.Folder + "/" + record.name
            const scriptContent = await GetScriptContent(fullPath)
            if (!scriptContent || !scriptContent.Command) {
                throw new Error("Invalid script content")
            }
            CommanderData.Scripts.push({
                ...scriptContent,
                id: record.id,
                name: record.name
            })
        } catch (error) {
            console.error("Failed to get script content:", error)
            // 如果获取失败，将enabled状态重置为false
            record.enabled = false

            Dialogs.Error({
                title: 'Error',
                message: `Failed to get content for script ${record.name}!`
            })
            // Modal.error({
            //     title: 'Error',
            //     content: `Failed to get content for script ${record.name}!`,
            // })
        }
    } else {
        // 如果是未选中状态，则从Scripts中删除该脚本
        const scriptIndex = CommanderData.Scripts.findIndex(script => script.name === record.name)
        if (scriptIndex > -1) {
            CommanderData.Scripts.splice(scriptIndex, 1)
        }
    }
}

const RunScripts = () => {
    CommanderData.PostScripts = []
    if (CommanderData.Scripts.length == 0) {
        Modal.error({
            title: 'Error',
            content: 'Please select at least one script!',
            maskClosable: false,
            okText: "OK",
        })
        return
    }
    for (let i = 0; i < CommanderData.Scripts.length; i++) {
        const currentScript = CommanderData.Scripts[i]
        CommanderData.PostScripts.push(GetCommand(currentScript))
    }
    if (CommanderData.UserName == '' || CommanderData.Password == '') {
        Modal.error({
            title: 'Error',
            content: 'Please enter username and password!',
            maskClosable: false,
            okText: "OK",
        })
        return
    }
    if (CommanderData.PostScripts.length == 0) {
        return
    }
    let postData = {
        IP: CommanderData.IP,
        Port: CommanderData.Port,
        UserName: CommanderData.UserName,
        Password: CommanderData.Password,
        Scripts: CommanderData.PostScripts
    }
    CommanderData.IsRunDisabled = true
    Run(postData).then(() => {
        CommanderData.IsRunDisabled = false
    })
    console.log(CommanderData.PostScripts)
}

</script>

<template>
    <div class="commander-container">
        <a-row :gutter="20">
            <!-- 第一列：宽度6 -->
            <a-col :span="6" style="height: calc(100vh - 100px);">
                <a-card title="Connection Settings" :bordered="true" style="height: 100%;">
                    <a-form :model="CommanderData" layout="horizontal">
                        <a-form-item label="IP" :label-col-props="{ span: 9 }" :wrapper-col-props="{ span: 15 }">
                            <a-input v-model="CommanderData.IP" />
                        </a-form-item>
                        <a-form-item label="Port" :label-col-props="{ span: 9 }" :wrapper-col-props="{ span: 15 }">
                            <a-input-number v-model="CommanderData.Port" />
                        </a-form-item>
                        <a-form-item label="CustomerUser" :label-col-props="{ span: 9 }"
                            :wrapper-col-props="{ span: 15 }">
                            <a-switch v-model="CommanderData.IsCustomerUser" @change="IsCustomerUser" />
                        </a-form-item>
                        <a-form-item label="UserName" :label-col-props="{ span: 9 }" :wrapper-col-props="{ span: 15 }">
                            <a-input :disabled="!CommanderData.IsCustomerUser" placeholder="Your UserName"
                                v-model="CommanderData.UserName" />
                        </a-form-item>
                        <a-form-item label="Password" :label-col-props="{ span: 9 }" :wrapper-col-props="{ span: 15 }">
                            <a-input-password :disabled="!CommanderData.IsCustomerUser"
                                v-if="CommanderData.IsCustomerUser" placeholder="Your Password"
                                v-model="CommanderData.Password" />
                            <a-input-password :disabled="!CommanderData.IsCustomerUser" v-else
                                v-model="CommanderData.Password" :invisible-button="false" />
                        </a-form-item>
                        <a-form-item label="" :wrapper-col-props="{ span: 24 }">
                            <div style="
                                        background-color: var(--color-fill-2);
                                        color: var(--color-text-1);
                                        border: 1px dashed var(--color-fill-4);
                                        height: 100px;
                                        width: 100%;
                                        border-radius: 2;
                                        line-height: 100px;
                                        text-align: center;
                                        padding: 3px;">
                                <div style=" width: 100%;" @click="GetFolder">
                                    <span style="color: #3370FF"> Click to Select Folder</span>
                                </div>
                            </div>

                        </a-form-item>
                        <a-form-item :wrapper-col-props="{ span: 24 }">
                            <a-button type="primary" @click="RunScripts" :disabled="CommanderData.IsRunDisabled"
                                style="width: 100%;">
                                Run Script
                            </a-button>
                        </a-form-item>
                    </a-form>
                </a-card>
            </a-col>

            <!-- 第二列：宽度8 -->
            <a-col :span="8" style="height: calc(100vh - 100px);">
                <a-card title="Scripts List" :bordered="true" style="height: 100%;">
                    <div style="margin-bottom: 15px;">
                        <strong>Folder Path:</strong>
                        <div style="margin-top: 10px;">{{ CommanderData.Folder }}</div>
                    </div>

                    <a-table :data="CommanderData.CurrentScripts" :pagination="false" :bordered="true"
                        style="max-height: calc(100vh - 230px); overflow-y: auto;">
                        <template #columns>
                            <a-table-column title="#" data-index="id" :width="50"></a-table-column>
                            <a-table-column title="Script Name" data-index="name">
                                <!-- 修改：使用Scroll函数替代scrollToScript -->
                                <template #cell="{ record }">
                                    <span style="cursor: pointer; color: #1890ff;" @click="Scroll(record.name)">
                                        {{ record.name }}
                                    </span>
                                </template>
                            </a-table-column>
                            <a-table-column title="Enabled">
                                <template #cell="{ record }">
                                    <!-- 修改：添加change事件处理 -->
                                    <a-switch v-model="record.enabled"
                                        @change="() => handleScriptEnableChange(record)" />
                                </template>
                            </a-table-column>
                        </template>
                        <!-- 数据为空 -->
                        <template #empty>
                            <a-empty description="Please Select the Script Folder!" />
                        </template>
                    </a-table>
                </a-card>
            </a-col>

            <!-- 第三列：宽度10 -->
            <a-col :span="10" style="height: calc(100vh - 100px);">
                <!-- 右侧列内容将在此处添加 -->
                <!-- 修改：添加ref引用 -->
                <a-card title="Scripts" :bordered="true" style="height: 100%; overflow-y: auto;"
                    ref="scriptsContainerRef">
                    <!-- 修改：根据Scripts数组渲染，而不是CurrentScripts -->
                    <a-card v-for="scriptContent, index in CommanderData.Scripts" :key="index"
                        :id="scriptContent.ScriptName.split('/').pop()" hoverable style="margin-bottom: 10px;">
                        <template #title>
                            <a-tooltip :content="scriptContent.ScriptName" background-color="#722ED1">
                                <!-- 修改：只显示文件名，不显示完整路径 -->
                                <p>{{ scriptContent.ScriptName.split('/').pop() }}</p>
                            </a-tooltip>
                        </template>
                        <a-tooltip :content="scriptContent.ScriptDescription" background-color="#722ED1">
                            <a-alert>{{ scriptContent.ScriptDescription }}</a-alert>
                        </a-tooltip>
                        <a-tooltip :content="GetCommand(scriptContent)" background-color="#722ED1">
                            <a-alert type="success">{{ GetCommand(scriptContent) }}</a-alert>
                        </a-tooltip>
                        <div style="margin-top: 5px;" v-for="parameter, idx in scriptContent.Parameter" :key="idx">

                            <div style="display: flex; align-items: center;">
                                <div style="flex-shrink: 0;">
                                    <a-select :style="{ width: '150px' }" v-model="parameter.ParameterValue"
                                        v-if="parameter.ParameterReferenceValue.length > 1">
                                        <a-option
                                            v-for="parameterReferenceValue, index in parameter.ParameterReferenceValue"
                                            :key="index">
                                            {{ parameterReferenceValue }}
                                        </a-option>
                                    </a-select>
                                    <a-input :style="{ width: '150px' }" v-model="parameter.ParameterValue"
                                        v-if="parameter.ParameterReferenceValue.length == 1" />
                                </div>
                                <div style="margin-left: 5px; flex-grow: 1; overflow: hidden;">
                                    <a-tooltip
                                        :content="parameter.ParameterDescription + ',Reference: ' + parameter.ParameterReferenceValue.join('/')"
                                        background-color="#722ED1">
                                        <span class="span_script"
                                            style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            {{ parameter.ParameterDescription + ', Reference: ' + parameter.ParameterReferenceValue.join('/') }}
                                        </span>
                                    </a-tooltip>
                                </div>
                            </div>

                        </div>
                    </a-card>
                </a-card>
            </a-col>
        </a-row>
    </div>
</template>

<style scoped>
.commander-container {
    padding: 20px;
}

.form-fields {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
}

.middle-column,
.right-column {
    background: #fafafa;
    padding: 15px;
    border-radius: 4px;
    min-height: 300px;
}

.upload-area {
    padding: 20px;
    border: 1px dashed #ccc;
    text-align: center;
    border-radius: 4px;
    cursor: pointer;
}
</style>