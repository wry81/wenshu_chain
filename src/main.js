import { createApp, ref } from 'vue'
import App from './App.vue'
// import Antd from 'ant-design-vue'
// import 'ant-design-vue/dist/reset.css'
import router from './router'

import './assets/styles/global.css' /*引入全局css文件*/
import '@vue-flow/core/dist/style.css';

const app = createApp(App)

// 提供一个全局可访问的 activeNodeId，用于 StepNode 识别并高亮自己
const globalActiveNodeId = ref(null);
app.provide('activeNodeId', globalActiveNodeId);

// app.use(Antd)
app.use(router)
app.mount('#app')