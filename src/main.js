import { createApp } from 'vue'
import App from './App.vue'
// import Antd from 'ant-design-vue'
// import 'ant-design-vue/dist/reset.css'
import router from './router'

import './assets/styles/global.css' /*引入全局css文件*/

const app = createApp(App)
// app.use(Antd)
app.use(router)
app.mount('#app')