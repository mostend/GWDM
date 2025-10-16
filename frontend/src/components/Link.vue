<template>
    <a-row style="height: 100%;">
        <a-col :span="18" style="height: 98%;">
            <!-- 为表格容器添加滚动样式 -->
            <div style="height: 100%; overflow: auto;">
                <a-table :columns="columns" :data="data" :pagination="false" :sticky-header="true" @row-click="(record, event) => {
                    handleRowSelect(record, event)
                }">
                    <!-- 添加 action 插槽 -->
                    <template #Action="{ record, rowIndex }">
                        <a-tooltip content="Add to Last">
                            <a-button @click="addToLast(rowIndex)" size="small" style="margin-right: 5px;">
                                <template #icon>
                                    <icon-plus />
                                </template>
                            </a-button>
                        </a-tooltip>
                        <a-tooltip content="Add to Next">
                            <a-button @click="addToNext(rowIndex)" size="small" style="margin-right: 5px;">
                                <template #icon>
                                    <icon-plus-circle />
                                </template>
                            </a-button>
                        </a-tooltip>
                        <a-tooltip content="Delete">
                            <a-button @click="deleteRow(rowIndex)" size="small" danger>
                                <template #icon>
                                    <icon-delete />
                                </template>
                            </a-button>
                        </a-tooltip>
                    </template>
                    <template #Model="{ record, rowIndex }">
                        <a-cascader v-model="record.Model" :options="cascaderOptions" path-mode
                            @change="(value) => onModelChange(value, rowIndex)"
                            :field-names="{ label: 'label', value: 'value', children: 'children' }" />
                    </template>
                </a-table>
            </div>
        </a-col>
        <a-col :span="6"
            style="position: fixed; right: 0; top: 0; height: 100%; overflow: auto; background: #fff; z-index: 100;">
            <div style="padding: 10px; border-left: 1px solid #ddd; height: 96%;">
                <div style="padding-bottom: 10px;">
                    <a-space>
                        <a-tooltip content="Show OSNR">
                            <a-button type="primary" @click="showOSNRChart">
                                <template #icon>
                                    <icon-eye />
                                </template>
                            </a-button>
                        </a-tooltip>
                        <a-tooltip content="Show Link">
                            <a-button type="primary" status="success" @click="showLinkChart">
                                <template #icon>
                                    <icon-link />
                                </template>
                            </a-button>
                        </a-tooltip>
                        <a-tooltip content="Save">
                            <a-button type="primary" status="warning" @click="saveData">
                                <template #icon>
                                    <icon-save />
                                </template>
                            </a-button>
                        </a-tooltip>
                        <a-tooltip content="Upload">
                            <a-button type="primary" status="danger" @click="uploadData">
                                <template #icon>
                                    <icon-upload />
                                </template>
                            </a-button>
                        </a-tooltip>
                    </a-space>
                </div>
                <div v-if="selectedRow !== null">
                    <a-card :bordered="false" style="box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                        <a-form :model="data[selectedRow]" layout="vertical">
                            <a-row :gutter="12">
                                <a-col :span="12" v-for="(value, key) in data[selectedRow]" :key="key"
                                    v-if="key !== 'No'">
                                    <a-form-item :label="key" :key="key">
                                        <a-input v-model="data[selectedRow][key]" v-if="key !== 'Model'"
                                            :readonly="key === 'No' || key === 'OSNR' || key === 'SpanLoss'" />
                                        <a-cascader v-model="data[selectedRow][key]" :options="cascaderOptions"
                                            v-else-if="key === 'Model'"
                                            @change="(value) => onModelChange(value, selectedRow)"
                                            :field-names="{ label: 'label', value: 'value', children: 'children' }"
                                            disabled />
                                    </a-form-item>
                                </a-col>
                            </a-row>
                        </a-form>
                    </a-card>
                </div>
                <div v-else>
                    <a-empty description="Please select" />
                </div>
            </div>
        </a-col>
    </a-row>

    <!-- OSNR 图表弹窗 -->
    <a-modal v-model:visible="osnrChartVisible" title="OSNR Chart (EDFA & Module Only)" :width="'95vw'" :footer="false">
        <div ref="chartContainer" style="width: 100%; height: 80vh"></div>
    </a-modal>

    <!-- Link 图表弹窗 -->
    <a-modal v-model:visible="linkChartVisible" title="Link Chart" :width="'95vw'" :footer="false">
        <div ref="linkChartContainer" style="width: 100%; height: 80vh"></div>
    </a-modal>
</template>

<script setup>
import { module } from '../optical/module.js';
import { optical, getCascaderOptions } from '../optical/optical.js';
import { calculateLink, calculateOSNR } from '../optical/calculation.js';
import { renderOSNRChart, renderLinkChart } from '../optical/chart.js';
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { IconPlus, IconPlusCircle, IconDelete, IconEye, IconLink, IconSave, IconUpload } from '@arco-design/web-vue/es/icon';
import { Notification, Modal } from '@arco-design/web-vue';
import { debounce } from 'lodash';
import * as echarts from 'echarts';


import { SaveFile, UploadFile } from '../../bindings/GWDM/backend/link/linkservice.js';

// 添加选中行的响应式变量
const selectedRow = ref(null);
const osnrChartVisible = ref(false);
const linkChartVisible = ref(false);
let chartInstance = null;
let linkChartInstance = null;
const chartContainer = ref(null);
const linkChartContainer = ref(null);

// 存储上一次选中的行元素
let previousSelectedRowElement = null;

const columns = [
    {
        title: 'No.',
        dataIndex: 'No',
        width: 60,
    },
    {
        title: 'Model',
        dataIndex: 'Model',
        slotName: 'Model',
        width: 250,
    },
    {
        title: 'SingleIn',
        dataIndex: 'SingleIn',
    },
    {
        title: 'SingleOut',
        dataIndex: 'SingleOut',
    },
    {
        title: 'MultiIn',
        dataIndex: 'MultiIn',
    },
    {
        title: 'MultiOut',
        dataIndex: 'MultiOut',
    },
    {
        title: 'SiteName',
        dataIndex: 'SiteName',
    },
    {
        title: 'OSNR',
        dataIndex: 'OSNR',
    },
    // 添加 Action 列
    {
        title: 'Action',
        dataIndex: 'Action',
        slotName: 'Action',
        width: 140
    }
];

// 确保数据是响应式的并且是数组格式
const data = reactive([
    {
        No: '1',
        Model: module[0].Model,
        SingleIn: module[0].SingleIn,
        SingleOut: module[0].SingleOut,
        MultiIn: module[0].MultiIn,
        MultiOut: module[0].MultiOut,
        OSNR: module[0].OSNR,
        SiteName: '',
    },
]);

const cascaderOptions = getCascaderOptions(optical)

// 定义操作按钮的处理函数
const addToLast = (rowIndex) => {
    // 添加到末尾的逻辑
    const newRow = {
        No: data.length + 1,
        Model: module[0].Model,
        SingleIn: module[0].SingleIn,
        SingleOut: module[0].SingleOut,
        MultiIn: module[0].MultiIn,
        MultiOut: module[0].MultiOut,
        OSNR: module[0].OSNR,
        SiteName: '',
    };
    data.push(newRow);
    calculateLink(data);
    calculateOSNR(data);
};

const addToNext = (rowIndex) => {
    // 添加到下一个的逻辑
    const newRow = {
        No: data.length + 1,
        Model: module[0].Model,
        SingleIn: module[0].SingleIn,
        SingleOut: module[0].SingleOut,
        MultiIn: module[0].MultiIn,
        MultiOut: module[0].MultiOut,
        OSNR: module[0].OSNR,
        SiteName: '',
    };
    data.splice(rowIndex + 1, 0, newRow);
    // 重新排序所有行的No
    for (let i = 0; i < data.length; i++) {
        data[i].No = i + 1;
    }
    calculateLink(data);
    calculateOSNR(data);
};

const deleteRow = (rowIndex) => {
    // 只有删除的不是第一项才能被删除
    if (rowIndex > 0 && data.length > 1) {
        data.splice(rowIndex, 1);
        // 更新后续行的序号
        for (let i = rowIndex; i < data.length; i++) {
            data[i].No = i + 1;
        }

        // 如果删除的是选中的行，清除选中状态
        if (selectedRow.value === rowIndex) {
            selectedRow.value = null;
        } else if (selectedRow.value > rowIndex) {
            // 如果选中的行在被删除行之后，需要更新选中行索引
            selectedRow.value = selectedRow.value - 1;
        }
        calculateLink(data);
        calculateOSNR(data);
    }
};

// 选中表格行时触发
const handleRowSelect = (record, event) => {
    // 清除上一次选中行的高亮
    if (previousSelectedRowElement) {
        const children = previousSelectedRowElement.children;
        for (let i = 0; i < children.length; i++) {
            children[i].style.backgroundColor = '';
        }
    }

    // 获取当前点击的行元素
    let currentRowElement = event.target;

    // 判断event.target如果是span元素或其他子元素，则向上查找直到找到tr元素
    while (currentRowElement && currentRowElement.tagName !== 'TR') {
        currentRowElement = currentRowElement.parentElement;
    }

    // 如果找到了tr元素，则将它的子元素都改成背景色
    if (currentRowElement) {
        const children = currentRowElement.children;
        for (let i = 0; i < children.length; i++) {
            children[i].style.backgroundColor = '#E6E6FA';
        }
        // 保存当前选中行元素以便下次清除
        previousSelectedRowElement = currentRowElement;
    }

    // 更新选中行索引
    selectedRow.value = data.indexOf(record);
};



const onModelChange = (value, rowIndex) => {
    // 设置选中行
    selectedRow.value = rowIndex;

    // 根据选择的模型更新行数据
    const selectedCategory = value[0];
    const selectedModel = value[1];

    // 查找对应的模型数据
    let modelData = null;

    // 根据分类查找对应模型数据
    switch (selectedCategory) {
        case 'Mux':
            modelData = optical.Mux.find(item => item.Model === selectedModel);
            break;
        case 'DeMux':
            modelData = optical.DeMux.find(item => item.Model === selectedModel);
            break;
        case 'Module':
            modelData = optical.Module.find(item => item.Model === selectedModel);
            break;
        case 'EDFA':
            modelData = optical.EDFA.find(item => item.Model === selectedModel);
            break;
        case 'Fiber':
            modelData = optical.Fiber.find(item => item.Model === selectedModel);
            break;
        case 'ROADM':
            modelData = optical.ROADM.find(item => item.Model === selectedModel);
            break;
        case 'OLP':
            modelData = optical.OLP.find(item => item.Model === selectedModel);
            break;
        case 'DCM':
            modelData = optical.DCM.find(item => item.Model === selectedModel);
            break
        case 'VOA':
            modelData = optical.VOA.find(item => item.Model === selectedModel);
            break;
    }

    // 如果找到模型数据，则更新行数据
    if (modelData) {
        // 保存当前的No值
        const currentNo = data[rowIndex].No;

        // 创建新的数据对象，包含模型的所有属性
        const newData = {
            No: currentNo,
            Model: selectedModel,
            ...modelData // 将模型的所有属性展开
        };

        // 替换原位置的数据
        data.splice(rowIndex, 1, newData);

        // 触发计算
        calculateLink(data);
        calculateOSNR(data);
    }
};

// 显示OSNR图表
const showOSNRChart = () => {
    osnrChartVisible.value = true;
    // 延迟渲染图表，确保DOM已经更新
    setTimeout(() => {
        if (chartInstance) {
            chartInstance.dispose();
        }
        chartInstance = renderOSNRChart(chartContainer.value, data, echarts);
    }, 100);
};

// 显示Link图表
const showLinkChart = () => {
    linkChartVisible.value = true;
    // 延迟渲染图表，确保DOM已经更新
    setTimeout(() => {
        if (linkChartInstance) {
            linkChartInstance.dispose();
        }
        linkChartInstance = renderLinkChart(linkChartContainer.value, data, echarts);
    }, 100);
};

// 添加保存数据功能
const saveData = () => {
    let jsonStr = JSON.stringify(data, null, 4);
    SaveFile(jsonStr)
}

// 添加上传数据功能
const uploadData = () => {
    // 这里可以添加上传数据的逻辑
    UploadFile().then(response => {
        if (response != "") {
            // 假设返回的数据格式与data一致
            const parsedData = JSON.parse(response);
            // 清空现有数据并添加新数据
            data.splice(0, data.length, ...parsedData);
            // 重新计算Link和OSNR
            // calculateLink(data);
            // calculateOSNR(data);
        } else {
            console.error('Upload failed:', response);
        }
    }).catch(error => {
        console.error('Upload error:', error);
    });
};


// 创建防抖版本的计算函数
const debouncedCalculateData = debounce((data) => {
    calculateLink(data);
    calculateOSNR(data);
}, 100); // 100ms 的防抖延迟

// 修改 watch 监听器
watch(data, (newData) => {
    debouncedCalculateData(newData);
}, { deep: true });

// 监听窗口大小变化，重新调整图表大小
onMounted(() => {
    window.addEventListener('resize', () => {
        if (chartInstance) {
            chartInstance.resize();
        }
        if (linkChartInstance) {
            linkChartInstance.resize();
        }
    });
    // 关闭所有通知
    Notification.clear();
});

</script>

<style scoped></style>