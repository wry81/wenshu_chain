import { createApp, ref } from 'vue'
import App from './App.vue'
// import Antd from 'ant-design-vue'
// import 'ant-design-vue/dist/reset.css'
import router from './router'

// import 'element-plus/dist/index.css';
import './assets/styles/global.css' /*引入全局css文件*/
// 导入 Vue Flow 核心样式
// import '@vue-flow/core/dist/style.css';
// 导入 Vue Flow 默认节点和边样式 (可选，但推荐)
// import '@vue-flow/core/dist/theme-default.css';
const app = createApp(App)

// 提供一个全局可访问的 activeNodeId，用于 StepNode 识别并高亮自己
const globalActiveNodeId = ref(null);
app.provide('activeNodeId', globalActiveNodeId);

// app.use(Antd)
app.use(router)
app.mount('#app')