import { optical } from './optical.js';

// 获取EDFA类型的设备数据用于图表显示
export const getEDFAChartData = (data) => {
    // 过滤出EDFA和Module类型的数据
    const filteredData = data.filter(item => {
        // 检查item.Model是否在optical.EDFA或optical.Module数组中
        return optical.EDFA.some(edfa => edfa.Model === item.Model) ||
            optical.Module.some(module => module.Model === item.Model);
    });

    // 准备图表数据
    const xAxisData = filteredData.map(item => `${item.No}-${item.Model}`);
    const seriesData = filteredData.map(item => parseFloat(item.OSNR) || 0);

    return {
        xAxisData,
        seriesData,
        filteredData
    };
};

// 渲染OSNR图表的逻辑
export const renderOSNRChart = (chartContainer, data, echarts) => {
    if (!chartContainer) return null;

    let chartInstance = echarts.init(chartContainer);

    // 使用过滤后的数据
    const chartData = getEDFAChartData(data);
    const { xAxisData, seriesData } = chartData;

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const param = params[0];
                return `${param.name}<br/>OSNR: ${param.value}`;
            }
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLabel: {
                rotate: 45,
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value',
            name: 'OSNR'
        },
        series: [{
            data: seriesData,
            type: 'line',
            smooth: true,
            itemStyle: {
                color: '#409EFF'
            },
            symbol: 'circle',
            symbolSize: 6,
            areaStyle: {
                opacity: 0.1
            }
        }],
        grid: {
            left: '10%',
            right: '10%',
            bottom: '20%',
            containLabel: true
        }
    };

    chartInstance.setOption(option);
    return chartInstance;
};

// 添加获取链路图表数据的函数
export const getLinkChartData = (data) => {
    // 准备图表数据
    const xAxisData = [];
    const singleSeriesData = [];
    const multiSeriesData = [];

    data.forEach(item => {
        // 添加In点数据
        xAxisData.push(`${item.No}-${item.Model}-In`);
        singleSeriesData.push(parseFloat(item.SingleIn) || 0);
        multiSeriesData.push(parseFloat(item.MultiIn) || 0);
        
        // 添加Out点数据
        xAxisData.push(`${item.No}-${item.Model}-Out`);
        singleSeriesData.push(parseFloat(item.SingleOut) || 0);
        multiSeriesData.push(parseFloat(item.MultiOut) || 0);
    });

    return {
        xAxisData,
        singleSeriesData,
        multiSeriesData
    };
};

// 渲染链路图表的逻辑
export const renderLinkChart = (chartContainer, data, echarts) => {
    if (!chartContainer) return null;

    let chartInstance = echarts.init(chartContainer);

    // 使用过滤后的数据
    const chartData = getLinkChartData(data);
    const { xAxisData, singleSeriesData, multiSeriesData } = chartData;

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                let tooltipText = params[0].name;
                params.forEach(param => {
                    tooltipText += `<br/>${param.seriesName}: ${param.value}`;
                });
                return tooltipText;
            }
        },
        legend: {
            data: ['Single', 'Multi'],
            top: '5%'
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLabel: {
                rotate: 45,
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value',
            name: 'Power (dBm)'
        },
        series: [
            {
                name: 'Single',
                data: singleSeriesData,
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: '#409EFF'
                },
                symbol: 'circle',
                symbolSize: 4
            },
            {
                name: 'Multi',
                data: multiSeriesData,
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: '#67C23A'
                },
                symbol: 'circle',
                symbolSize: 4
            }
        ],
        grid: {
            left: '10%',
            right: '10%',
            bottom: '20%',
            containLabel: true
        }
    };

    chartInstance.setOption(option);
    return chartInstance;
};