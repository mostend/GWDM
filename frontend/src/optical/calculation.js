// 计算方法整合文件

import { optical } from './optical.js';
import { Notification, Modal } from '@arco-design/web-vue';
// Mux_DeMux的计算逻辑
export const calculateMux = (currentData, previousData, data) => {
    if (previousData) {
        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    // multiOut = singleIn + 10*LOG10(channel) - currentData.InsertionLoss
    currentData.MultiOut = (
        parseFloat(currentData.SingleIn) +
        10 * Math.log10(parseFloat(currentData.Channel)) -
        parseFloat(currentData.InsertionLoss))
        .toFixed(2);
};

export const calculateDeMux = (currentData, previousData, data) => {
    if (previousData) {
        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    // multiOut = singleIn + 10*LOG10(channel) - currentData.InsertionLoss
};

// Module的计算逻辑
export const calculateModule = (currentData, previousData, data) => {
    if (previousData) {

        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        // 先获取所有的edfa项目
        const edfaData = data.filter(item => {
            // 检查item.Model是否在optical.EDFA数组中
            return optical.EDFA.some(edfa => edfa.Model === item.Model);
        });
        // OSNR为edfa最后一个的OSNR
        if (edfaData.length > 0) {
            currentData.OSNR = parseFloat(edfaData[edfaData.length - 1].OSNR).toFixed(2);
        }
    }
    if (parseFloat(currentData.SingleIn) > parseFloat(currentData.Overload) ||
        parseFloat(currentData.SingleIn) < parseFloat(currentData.Sensitivity)) {
        Notification.clear();
        Notification.warning({
            title: 'Warning',
            content: `The single input power of the item:${currentData.No}: ${currentData.Model} is out of range!`,
            position: 'bottomRight',
        });
    }

};

// EDFA的计算逻辑
export const calculateEDFA = (currentData, previousData, data) => {
    if (previousData) {
        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
    }

    // 首先需要判断Gain是否在正常范围内
    if (parseFloat(currentData.Gain) < parseFloat(currentData.MinGainLimit) ||
        parseFloat(currentData.Gain) > parseFloat(currentData.MaxGainLimit)) {
        Notification.clear();
        Notification.warning({
            title: 'Warning',
            content: `The Gain of the item:${currentData.No}: ${currentData.Model} is out of range!`,
            position: 'bottomRight',
        });
    }
    //判断输入是否在范围内
    if (currentData.SingleIn > parseFloat(currentData.MaxInLimit) ||
        currentData.SingleIn < parseFloat(currentData.MinInLimit) ||
        currentData.MultiIn > parseFloat(currentData.MaxInLimit) ||
        currentData.MultiIn < parseFloat(currentData.MinInLimit)
    ) {
        Notification.clear();
        Notification.warning({
            title: 'Warning',
            content: `The single or multi input power of the item:${currentData.No}: ${currentData.Model}  is out of range!`,
            position: 'bottomRight',
        })
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) + parseFloat(currentData.Gain)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) + parseFloat(currentData.Gain)).toFixed(2);

    // 判断输出是否在范围内
    if (currentData.MultiOut > parseFloat(currentData.MaxOutLimit)) {
        Notification.clear();
        Notification.warning({
            title: 'Warning',
            content: `The multi out power of the item: ${currentData.No}: ${currentData.Model}  is out of range!`,
            position: 'bottomRight',
        })
    }

};

// Fiber的计算逻辑
export const calculateFiber = (currentData, previousData, data) => {
    if (previousData) {
        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
    }
    currentData.SpanLoss = (parseFloat(currentData.Distance) * parseFloat(currentData.PerKmLoss)).toFixed(2)
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.SpanLoss)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) - parseFloat(currentData.SpanLoss)).toFixed(2);
};

// ROADM的计算逻辑
export const calculateROADM = (currentData, previousData, data) => {
    if (previousData) {
        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    // multiOut = singleIn + 10*LOG10(channel) - currentData.InsertionLoss
    currentData.MultiOut = (
        parseFloat(currentData.MultiIn) -
        parseFloat(currentData.InsertionLoss))
        .toFixed(2);

};
// OLP的计算逻辑
export const calculateOLP = (currentData, previousData, data) => {
    if (previousData) {
        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    // multiOut = singleIn + 10*LOG10(channel) - currentData.InsertionLoss
    currentData.MultiOut = (
        parseFloat(currentData.MultiIn) -
        parseFloat(currentData.InsertionLoss))
        .toFixed(2);

};

export const calculateDCM = (currentData, previousData, data) => {
    if (previousData) {
        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.SpanLoss)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) - parseFloat(currentData.SpanLoss)).toFixed(2);
};

export const calculateVOA = (currentData, previousData, data) => {
    if (previousData) {
        currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
        currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
}

// 根据模型类型获取计算函数
export const getCalculationFunction = (model) => {

    if (optical.Mux.some(item => item.Model === model)) {
        return calculateMux;
    } else if (optical.DeMux.some(item => item.Model === model)) {
        return calculateDeMux;
    } else if (optical.Module.some(item => item.Model === model)) {
        return calculateModule;
    } else if (optical.EDFA.some(item => item.Model === model)) {
        return calculateEDFA;
    } else if (optical.Fiber.some(item => item.Model === model)) {
        return calculateFiber;
    } else if (optical.ROADM.some(item => item.Model === model)) {
        return calculateROADM;
    } else if (optical.OLP.some(item => item.Model === model)) {
        return calculateOLP;
    } else if (optical.DCM.some(item => item.Model === model)) {
        return calculateDCM;
    } else if (optical.VOA.some(item => item.Model === model)) {
        return calculateVOA;
    }
    return null;
};

// 主计算函数
export const calculateLink = (data) => {
    for (let i = 0; i < data.length; i++) {
        const currentData = data[i];
        const previousData = i > 0 ? data[i - 1] : null;

        // 根据模型类型调用相应的计算函数
        if (currentData.Model) {
            const calculateFunc = getCalculationFunction(currentData.Model);

            if (calculateFunc) {
                calculateFunc(currentData, previousData, data);
            } else {
                // 默认情况下，将前一个的SingleOut设置为当前的SingleIn
                if (previousData) {
                    currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
                    currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
                }
                // 添加默认输出值并保留两位小数
                currentData.SingleOut = parseFloat(currentData.SingleIn || 0).toFixed(2);
                currentData.MultiOut = parseFloat(currentData.MultiIn || 0).toFixed(2);
            }
        } else {
            // 默认情况下，将前一个的SingleOut设置为当前的SingleIn
            if (previousData) {
                currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
                currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
            }
            // 添加默认输出值并保留两位小数
            currentData.SingleOut = parseFloat(currentData.SingleIn || 0).toFixed(2);
            currentData.MultiOut = parseFloat(currentData.MultiIn || 0).toFixed(2);
        }
    }
};

// OSNR计算函数
export const calculateOSNR = (data) => {
    // 先获取所有的edfa项目
    const edfaData = data.filter(item => {
        // 检查item.Model是否在optical.EDFA数组中
        return optical.EDFA.some(edfa => edfa.Model === item.Model);
    });
    calculateCascadedOSNR(edfaData);
};


function calculateCascadedOSNR(stages) {

    // --- 物理常量 ---
    const h = 6.62607e-34; // 普朗克常数 (J·s)
    const c = 2.99792458e8;  // 真空中的光速 (m/s)

    // --- 单位转换辅助函数 ---
    const dbmToWatts = (dbm) => Math.pow(10, (dbm - 30) / 10);
    const dbToLinear = (db) => Math.pow(10, db / 10);
    const linearToDb = (linear) => 10 * Math.log10(linear);

    // --- 初始参数计算 ---
    const wavelength = 1550; // 默认波长为1550nm
    const referenceBandwidth = 12.5; // 默认
    // --- 初始参数计算 ---
    const f = c / (wavelength * 1e-9); // 光频率 (Hz)
    const Br = referenceBandwidth * 1e9; // 参考带宽 (Hz)


    // OSNR的倒数累加，1/OSNR_total = 1/OSNR_1 + 1/OSNR_2 + ...
    // 而每一级的 1/OSNR_stage = (F * h * f * Br) / P_in
    // 所以我们直接累加 (F * h * f * Br) / P_in
    let totalInverseOsnr = 0; // 初始信号无噪声，1/OSNR_in ≈ 0

    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        // --- 参数线性化 ---
        const Pin_linear = dbmToWatts(stage.SingleIn);
        const F_linear = dbToLinear(stage.NF);

        // --- 计算当前级的ASE噪声贡献 ---
        // 这个值实际上是 (Signal / Noise_ASE)^-1，即信噪比的倒数
        const stageInverseOsnr = (F_linear * h * f * Br) / Pin_linear;

        // --- 累加总的OSNR倒数 ---
        totalInverseOsnr += stageInverseOsnr;

        // --- 计算当前级的输出参数 ---
        const stageOutputOsnr_linear = 1 / totalInverseOsnr;
        stage.OSNR = linearToDb(stageOutputOsnr_linear).toFixed(2);

        // const finalOsnr_linear = 1 / totalInverseOsnr;
        // const finalOsnr_dB = linearToDb(finalOsnr_linear);
    }

}