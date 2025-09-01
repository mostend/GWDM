<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Fec2Q_Factor } from '../../bindings/GWDM/backend/fec/fecservice'
import { Notification, Modal } from '@arco-design/web-vue';

const FEC2QData = reactive({
    PreFEC: "",
    Q_Factor: "",
})
const calculateQFactor = () => {
    Fec2Q_Factor(FEC2QData).then((result) => {
        FEC2QData.Q_Factor = result.Q_Factor
    })
}

onMounted(() => {
    // 关闭所有通知
    Notification.clear();
});

</script>

<template>
    <a-row style="padding: 20px;">
        <a-col :span="8" :offset="8">
            <div :style="{ display: 'flex' }">
                <a-card :style="{ width: '100%' }" title="PreFEC to Q-Factor">
                    <a-form :style="{ width: '100%' }">
                        <a-form-item label="PreFEC">
                            <a-input v-model="FEC2QData.PreFEC" type="text" @input="calculateQFactor"
                                placeholder="Please Type Your PreFEC..." />
                        </a-form-item>
                        <a-form-item label="Q(dB)">
                            <div style="font-size: 16px; font-weight: bold; color: #000;">{{ FEC2QData.Q_Factor }}</div>
                        </a-form-item>
                        <a-form-item label="Formula" class="font">
                            <math xmlns='http://www.w3.org/1998/Math/MathML'>
                                <mi> Q </mi>
                                <mo> = </mo>
                                <msqrt>
                                    <mn> 2 </mn>
                                </msqrt>
                                <mo> &#x00B7; <!-- middle dot --> </mo>
                                <mi> e </mi>
                                <mi> r </mi>
                                <mi> f </mi>
                                <msup>
                                    <mrow>
                                        <mi> c </mi>
                                    </mrow>
                                    <mrow>
                                        <mo> - </mo>
                                        <mn> 1 </mn>
                                    </mrow>
                                </msup>
                                <mrow>
                                    <mo> ( </mo>
                                    <mn> 2 </mn>
                                    <mo> &#x00B7; <!-- middle dot --> </mo>
                                    <mi> B </mi>
                                    <mi> E </mi>
                                    <mi> R </mi>
                                    <mo> ) </mo>
                                </mrow>
                            </math>
                        </a-form-item>
                        <a-form-item class="font">
                            <math xmlns='http://www.w3.org/1998/Math/MathML'>
                                <msub>
                                    <mrow>
                                        <mi> Q </mi>
                                    </mrow>
                                    <mrow>
                                        <mi> d </mi>
                                        <mi> B </mi>
                                    </mrow>
                                </msub>
                                <mo> = </mo>
                                <mn> 20 </mn>
                                <mo> &#x00B7; <!-- middle dot --> </mo>
                                <msub>
                                    <mrow>
                                        <mi> log </mi>
                                    </mrow>
                                    <mrow>
                                        <mn> 10 </mn>
                                    </mrow>
                                </msub>
                                <mrow>
                                    <mo> ( </mo>
                                    <mi> Q </mi>
                                    <mo> ) </mo>
                                </mrow>
                            </math>
                        </a-form-item>
                    </a-form>
                </a-card>
            </div>
        </a-col>
    </a-row>
</template>

<style scoped>
.font {
    font-size: 16px;
    font-weight: bold;
    color: #000;
}
</style>