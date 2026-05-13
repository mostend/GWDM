// 计算方法整合文件

import { optical } from './optical.js';

const buildWarning = (currentData, content) => ({
    key: `${currentData.No}-${currentData.Model}-${content}`,
    title: 'Warning',
    content,
    position: 'bottomRight',
});

const syncInputsFromPrevious = (currentData, previousData) => {
    if (!previousData) {
        return;
    }

    currentData.SingleIn = parseFloat(previousData.SingleOut).toFixed(2);
    currentData.MultiIn = parseFloat(previousData.MultiOut).toFixed(2);
};

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
    } else if (optical.RAMAN.some(item => item.Model === model)) {
        return calculateRAMAN;
    }
    return null;
};



// Mux_DeMux的计算逻辑
export const calculateMux = (currentData, previousData, data) => {
    syncInputsFromPrevious(currentData, previousData);
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    // multiOut = singleIn + 10*LOG10(channel) - currentData.InsertionLoss
    currentData.MultiOut = (
        parseFloat(currentData.SingleIn) +
        10 * Math.log10(parseFloat(currentData.Channel)) -
        parseFloat(currentData.InsertionLoss))
        .toFixed(2);
};

export const calculateDeMux = (currentData, previousData, data) => {
    syncInputsFromPrevious(currentData, previousData);
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    // multiOut = singleIn + 10*LOG10(channel) - currentData.InsertionLoss
};

// Module的计算逻辑
export const calculateModule = (currentData, previousData, data) => {
    const warnings = [];
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
        warnings.push(buildWarning(
            currentData,
            `The single input power of the item:${currentData.No}: ${currentData.Model} is out of range!`
        ));
    }

    return warnings;
};


// RAMAN的计算逻辑
export const calculateRAMAN = (currentData, previousData, data) => {
    const warnings = [];
    syncInputsFromPrevious(currentData, previousData);

    // 首先需要判断Gain是否在正常范围内
    if (parseFloat(currentData.Gain) < parseFloat(currentData.MinGainLimit) ||
        parseFloat(currentData.Gain) > parseFloat(currentData.MaxGainLimit)) {
        warnings.push(buildWarning(
            currentData,
            `The Gain of the item:${currentData.No}: ${currentData.Model} is out of range!`
        ));
    }

    //判断输入是否在范围内
    if (currentData.SingleIn > parseFloat(currentData.MaxInLimit) ||
        currentData.SingleIn < parseFloat(currentData.MinInLimit) ||
        currentData.MultiIn > parseFloat(currentData.MaxInLimit) ||
        currentData.MultiIn < parseFloat(currentData.MinInLimit)
    ) {
        warnings.push(buildWarning(
            currentData,
            `The single or multi input power of the item:${currentData.No}: ${currentData.Model}  is out of range!`
        ))
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) + parseFloat(currentData.Gain)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) + parseFloat(currentData.Gain)).toFixed(2);

    // 判断输出是否在范围内
    if (currentData.MultiOut > parseFloat(currentData.MaxOutLimit)) {
        warnings.push(buildWarning(
            currentData,
            `The multi out power of the item: ${currentData.No}: ${currentData.Model}  is out of range!`
        ))
    }

    return warnings;
}


// EDFA的计算逻辑
export const calculateEDFA = (currentData, previousData, data) => {
    const warnings = [];
    syncInputsFromPrevious(currentData, previousData);

    // 首先需要判断Gain是否在正常范围内
    if (parseFloat(currentData.Gain) < parseFloat(currentData.MinGainLimit) ||
        parseFloat(currentData.Gain) > parseFloat(currentData.MaxGainLimit)) {
        warnings.push(buildWarning(
            currentData,
            `The Gain of the item:${currentData.No}: ${currentData.Model} is out of range!`
        ));
    }
    //判断输入是否在范围内
    if (currentData.SingleIn > parseFloat(currentData.MaxInLimit) ||
        currentData.SingleIn < parseFloat(currentData.MinInLimit) ||
        currentData.MultiIn > parseFloat(currentData.MaxInLimit) ||
        currentData.MultiIn < parseFloat(currentData.MinInLimit)
    ) {
        warnings.push(buildWarning(
            currentData,
            `The single or multi input power of the item:${currentData.No}: ${currentData.Model}  is out of range!`
        ))
    }
    currentData.SingleOut = (parseFloat(currentData.SingleIn) + parseFloat(currentData.Gain)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) + parseFloat(currentData.Gain)).toFixed(2);

    // 判断输出是否在范围内
    if (currentData.MultiOut > parseFloat(currentData.MaxOutLimit)) {
        warnings.push(buildWarning(
            currentData,
            `The multi out power of the item: ${currentData.No}: ${currentData.Model}  is out of range!`
        ))
    }
    // 如果上一级是RAMAN，则计算等效NF
    if (previousData && optical.RAMAN.some(item => item.Model === previousData.Model)) {
        currentData.EquivalentNF = (parseFloat(currentData.NF) + parseFloat(previousData.EquivalentNF)).toFixed(2);
    } else {
        currentData.EquivalentNF = parseFloat(currentData.NF).toFixed(2);
    }

    return warnings;
};

// Fiber的计算逻辑
export const calculateFiber = (currentData, previousData, data) => {
    syncInputsFromPrevious(currentData, previousData);
    currentData.SpanLoss = (parseFloat(currentData.Distance) * parseFloat(currentData.PerKmLoss)).toFixed(2)
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.SpanLoss)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) - parseFloat(currentData.SpanLoss)).toFixed(2);
};

// ROADM的计算逻辑
export const calculateROADM = (currentData, previousData, data) => {
    syncInputsFromPrevious(currentData, previousData);
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    // multiOut = singleIn + 10*LOG10(channel) - currentData.InsertionLoss
    currentData.MultiOut = (
        parseFloat(currentData.MultiIn) -
        parseFloat(currentData.InsertionLoss))
        .toFixed(2);

};
// OLP的计算逻辑
export const calculateOLP = (currentData, previousData, data) => {
    syncInputsFromPrevious(currentData, previousData);
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    // multiOut = singleIn + 10*LOG10(channel) - currentData.InsertionLoss
    currentData.MultiOut = (
        parseFloat(currentData.MultiIn) -
        parseFloat(currentData.InsertionLoss))
        .toFixed(2);

};
// DCM的计算逻辑
export const calculateDCM = (currentData, previousData, data) => {
    syncInputsFromPrevious(currentData, previousData);
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.SpanLoss)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) - parseFloat(currentData.SpanLoss)).toFixed(2);
};

export const calculateVOA = (currentData, previousData, data) => {
    syncInputsFromPrevious(currentData, previousData);
    currentData.SingleOut = (parseFloat(currentData.SingleIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
    currentData.MultiOut = (parseFloat(currentData.MultiIn) - parseFloat(currentData.InsertionLoss)).toFixed(2);
}



// 主计算函数
export const calculateLink = (data) => {
    const warnings = [];
    for (let i = 0; i < data.length; i++) {
        const currentData = data[i];
        const previousData = i > 0 ? data[i - 1] : null;

        // 根据模型类型调用相应的计算函数
        if (currentData.Model) {
            const calculateFunc = getCalculationFunction(currentData.Model);

            if (calculateFunc) {
                const currentWarnings = calculateFunc(currentData, previousData, data) || [];
                warnings.push(...currentWarnings);
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

    return warnings;
};

// OSNR计算函数
export const calculateOSNR = (data) => {
    const edfaData = data.filter(item => {
        return optical.EDFA.some(edfa => edfa.Model === item.Model);
    });
    calculateCascadedOSNR(edfaData, data);
};

function calculateCascadedOSNR(stages, data) {
    if (!stages || stages.length === 0) return;

    const n = stages.length;
    const firstStageSingleIn = parseFloat(stages[0].SingleIn);

    const moduleData = data.find(item =>
        optical.Module.some(mod => mod.Model === item.Model)
    );
    const moduleSingleIn = moduleData ? parseFloat(moduleData.SingleIn) : 0;

    let cumulativeDeltaGxLProduct = 1;
    let prevF_linear = null;
    let prevL_linear = null;

    for (let i = 0; i < n; i++) {
        const stage = stages[i];
        const gain = parseFloat(stage.Gain);
        const equivalentNF = parseFloat(stage.EquivalentNF);

        const G_linear = Math.pow(10, gain / 10);
        const F_linear = Math.pow(10, equivalentNF / 10);

        let spanLoss;
        if (i === n - 1) {
            spanLoss = parseFloat(stage.SingleOut) - moduleSingleIn;
        } else {
            const nextStage = stages[i + 1];
            spanLoss = parseFloat(stage.SingleOut) - parseFloat(nextStage.SingleIn);
        }

        const L_linear = Math.pow(10, -spanLoss / 10);
        const DeltaGxL = G_linear * L_linear;

        let Fsys_linear;
        if (i === 0) {
            Fsys_linear = F_linear;
        } else {
            Fsys_linear = prevF_linear + (F_linear - prevL_linear) / cumulativeDeltaGxLProduct;
        }

        const Fsys_dB = 10 * Math.log10(Fsys_linear);
        stage.OSNR = (firstStageSingleIn + 58 - Fsys_dB).toFixed(2);

        cumulativeDeltaGxLProduct *= DeltaGxL;
        prevF_linear = Fsys_linear;
        prevL_linear = L_linear;
    }
}
