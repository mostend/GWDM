<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Fec2Q_Factor, Q_Factor2Fec } from '../../bindings/GWDM/backend/fec/fecservice'
import { Notification, Modal } from '@arco-design/web-vue';

const FEC2QData = reactive({
    PreFEC: "",
    Q_Factor: "",
})

const Q2FECData = reactive({
    PreFEC: "",
    EngineeringPreFEC: "",
    Q_Factor: "",
})
const calculateQFactor = () => {
    Fec2Q_Factor(FEC2QData).then((result) => {
        FEC2QData.Q_Factor = result.Q_Factor
    })
}

const calculatePreFEC = () => {
    Q_Factor2Fec(Q2FECData).then((result) => {
        console.log(result)
        Q2FECData.PreFEC = result.PreFEC
        Q2FECData.EngineeringPreFEC = result.EngineeringPreFEC
    })
}

onMounted(() => {
    // 关闭所有通知
    Notification.clear();
});

</script>

<template>
    <a-row style="padding: 20px;">
        <a-col :span="12">
            <div :style="{ display: 'flex' }">
                <a-card :style="{ width: '100%', height: '500px' }" title="PreFEC to Q-Factor">
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
                                <msub>
                                    <mrow>
                                        <mi> Q </mi>
                                    </mrow>
                                    <mrow>
                                        <mi> l </mi>
                                        <mi> i </mi>
                                        <mi> n </mi>
                                        <mi> e </mi>
                                        <mi> a </mi>
                                        <mi> r </mi>
                                    </mrow>
                                </msub>
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
                                    <msub>
                                        <mrow>
                                            <mi> Q </mi>
                                        </mrow>
                                        <mrow>
                                            <mi> l </mi>
                                            <mi> i </mi>
                                            <mi> n </mi>
                                            <mi> e </mi>
                                            <mi> a </mi>
                                            <mi> r </mi>
                                        </mrow>
                                    </msub>
                                    <mo> ) </mo>
                                </mrow>
                            </math>
                        </a-form-item>
                    </a-form>
                </a-card>
            </div>
        </a-col>
        <a-col :span="12">
            <div :style="{ display: 'flex' }">
                <a-card :style="{ width: '100%', height: '500px' }" title="Q-Factor to PreFEC">
                    <a-form :style="{ width: '100%' }">
                        <a-form-item label="Q(dB)">
                            <a-input v-model="Q2FECData.Q_Factor" type="text" @input="calculatePreFEC"
                                placeholder="Please Type Your Q(dB)..." />
                        </a-form-item>
                        <a-form-item label="PreFEC">
                            <div style="font-size: 16px; font-weight: bold; color: #000;">{{ Q2FECData.PreFEC }}</div>
                        </a-form-item>
                        <a-form-item label="EngineeringPreFEC">
                            <div style="font-size: 16px; font-weight: bold; color: #000;">
                                {{ Q2FECData.EngineeringPreFEC }}
                            </div>
                        </a-form-item>

                        <a-form-item label="Formula" class="font">
                            <math xmlns='http://www.w3.org/1998/Math/MathML'>
                                <msub>
                                    <msub>
                                        <mrow>
                                            <mi> Q </mi>
                                        </mrow>
                                        <mrow>
                                            <mi> l </mi>
                                            <mi> i </mi>
                                            <mi> n </mi>
                                            <mi> e </mi>
                                            <mi> a </mi>
                                            <mi> r </mi>
                                        </mrow>
                                    </msub>
                                </msub>
                                <mo> = </mo>
                                <msup>
                                    <mrow>
                                        <mn> 10 </mn>
                                    </mrow>
                                    <mrow>
                                        <mfrac>
                                            <mrow>
                                                <msub>
                                                    <mrow>
                                                        <mi> Q </mi>
                                                    </mrow>
                                                    <mrow>
                                                        <mi> d </mi>
                                                        <mi> B </mi>
                                                    </mrow>
                                                </msub>
                                            </mrow>
                                            <mrow>
                                                <mn> 20 </mn>
                                            </mrow>
                                        </mfrac>
                                    </mrow>
                                </msup>
                            </math>
                        </a-form-item>
                        <a-form-item class="font">
                            <math xmlns='http://www.w3.org/1998/Math/MathML'>
                                <mi> B </mi>
                                <mi> E </mi>
                                <mi> R </mi>
                                <mo> = </mo>
                                <mfrac>
                                    <mrow>
                                        <mn> 1 </mn>
                                    </mrow>
                                    <mrow>
                                        <mn> 2 </mn>
                                    </mrow>
                                </mfrac>
                                <mo> . </mo>
                                <mi> e </mi>
                                <mi> r </mi>
                                <mi> f </mi>
                                <mi> c </mi>
                                <mrow>
                                    <mo> ( </mo>
                                    <mfrac>
                                        <mrow>
                                            <msub>
                                                <mrow>
                                                    <mi> Q </mi>
                                                </mrow>
                                                <mrow>
                                                    <mi> l </mi>
                                                    <mi> i </mi>
                                                    <mi> n </mi>
                                                    <mi> e </mi>
                                                    <mi> a </mi>
                                                    <mi> r </mi>
                                                </mrow>
                                            </msub>
                                        </mrow>
                                        <mrow>
                                            <msqrt>
                                                <mn> 2 </mn>
                                            </msqrt>
                                        </mrow>
                                    </mfrac>
                                    <mo> ) </mo>
                                </mrow>
                            </math>
                        </a-form-item>

                        <a-form-item label="Engineering" class="font">
                            <math xmlns='http://www.w3.org/1998/Math/MathML'>
                                <mi> B </mi>
                                <mi> E </mi>
                                <mi> R </mi>
                                <mo> = </mo>
                                <mfrac>
                                    <mrow>
                                        <mn> 1 </mn>
                                    </mrow>
                                    <mrow>
                                        <msqrt>
                                            <mn> 2 </mn>
                                            <mi> &#x03C0; <!-- greek small letter pi --> </mi>
                                        </msqrt>
                                        <msub>
                                            <mrow>
                                                <mi> Q </mi>
                                            </mrow>
                                            <mrow>
                                                <mi> l </mi>
                                                <mi> i </mi>
                                                <mi> n </mi>
                                                <mi> e </mi>
                                                <mi> a </mi>
                                                <mi> r </mi>
                                            </mrow>
                                        </msub>
                                    </mrow>
                                </mfrac>
                                <mo> . </mo>
                                <mi> exp </mi>
                                <mrow>
                                    <mo> ( </mo>
                                    <mo> - </mo>
                                    <mfrac>
                                        <mrow>
                                            <msup>
                                                <mrow>
                                                    <mrow>
                                                        <msub>
                                                            <mrow>
                                                                <mi> Q </mi>
                                                            </mrow>
                                                            <mrow>
                                                                <mi> l </mi>
                                                                <mi> i </mi>
                                                                <mi> n </mi>
                                                                <mi> e </mi>
                                                                <mi> a </mi>
                                                                <mi> r </mi>
                                                            </mrow>
                                                        </msub>
                                                    </mrow>
                                                </mrow>
                                                <mrow>
                                                    <mn> 2 </mn>
                                                </mrow>
                                            </msup>
                                        </mrow>
                                        <mrow>
                                            <mn> 2 </mn>
                                        </mrow>
                                    </mfrac>
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