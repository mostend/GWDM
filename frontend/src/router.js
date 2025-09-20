import { createRouter, createWebHashHistory } from 'vue-router'

import Link from './components/Link.vue'
import Commander from './components/Commander.vue'
import Fec2Q from './components/Fec2Q.vue'
import CommanderResult from './components/CommanderResult.vue'
import B2BOSNR from './components/B2BOSNR.vue'

const routes = [
    { path: '/', component: Link },
    { path: '/Commander', component: Commander },
    { path: "/Fec2Q", component: Fec2Q },
    { path: "/CommanderResult", component: CommanderResult },
    { path: '/B2BOSNR', component: B2BOSNR },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router