import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue' // 引入 RegisterPage 组件
import Main from '../views/Main.vue'

// 顶级导航页面
import InsightEnginePage from '../views/InsightEnginePage.vue'; // 洞察引擎主页面
import NarrativeEnginePage from '../views/NarrativeEnginePage.vue';
import IPActivationEnginePage from '../views/IPActivationEnginePage.vue';
import KnowledgeBasePage from '../views/KnowledgeBasePage.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage }, // 添加 RegisterPage 的路由
  {
    path: '/main', // Main.vue 作为布局容器
    component: Main,
    redirect: '/main/insight-engine', // 默认进入 /main 后重定向到洞察引擎
    children: [
      {
        path: 'insight-engine', // 洞察引擎的路由
        name: 'InsightEngine',
        component: InsightEnginePage, // InsightEnginePage 是洞察引擎模块的唯一入口
        meta: { topNav: 'insight-engine' }, // 用于激活顶部导航
      },
      {
        path: 'narrative-engine',
        name: 'NarrativeEngine',
        component: NarrativeEnginePage,
        meta: { topNav: 'narrative-engine' },
      },
      {
        path: 'ip-activation-engine',
        name: 'IPActivationEngine',
        component: IPActivationEnginePage,
        meta: { topNav: 'ip-activation-engine' },
      },
      {
        path: 'knowledge-base',
        name: 'KnowledgeBase',
        component: KnowledgeBasePage,
        meta: { topNav: 'knowledge-base' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router