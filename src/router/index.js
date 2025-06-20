import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import Main from '../views/Main.vue'
import AgentTestPage from '../views/AgentTestPage.vue'

// 顶级导航页面
import InsightEnginePage from '../views/InsightEnginePage.vue';
import NarrativeEnginePage from '../views/NarrativeEnginePage.vue';
import IPActivationEnginePage from '../views/IPActivationEnginePage.vue';
import KnowledgeBasePage from '../views/KnowledgeBasePage.vue';

// 导入 InsightEnginePage 的子组件（侧边栏项对应的实际页面）
// 假设这些文件位于 src/views/InsightEngine/ 目录下
import DashboardPage from '../views/InsightEngine/DashboardPage.vue';
import SmartInsightPage from '../views/InsightEngine/SmartInsightPage.vue';
import HistoryPage from '../views/InsightEngine/InsightHistoryPage.vue';
// 修改这里：导入新的文件名
import NodeEdit from '../views/NodeEdit.vue';


const routes = [
  { path: '/', redirect: '/login' },
  { path: '/agent-test/:agentId?', component: AgentTestPage, props: true },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  {
    path: '/main', // Main.vue 作为布局容器
    component: Main,
    redirect: '/main/insight-engine/dashboard',
    children: [
      {
        path: 'insight-engine',
        component: InsightEnginePage,
        meta: { topNav: 'insight-engine' },
        redirect: '/main/insight-engine/dashboard',
        children: [
          {
            path: 'dashboard',
            name: 'InsightEngineDashboard',
            component: DashboardPage,
          },
          {
            path: 'smart-insight',
            name: 'InsightEngineSmartInsight',
            component: SmartInsightPage,
          },
          {
            // 修改这里：路径和组件引用
            path: 'smart-insight/:agentId/editor', // 保持路径不变，因为你点击智能体后进入的是 editor 路径
            name: 'SmartInsightEditor', // 保持名称不变，或者根据需要修改为 'NodeEditRedbook'，这里我选择保持，因为它更描述路由功能
            component: NodeEdit, // 引用新的组件文件名
            props: true,
          },
          {
            path: 'history',
            name: 'InsightEngineHistory',
            component: HistoryPage,
          },
        ]
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
      {
        path: 'agent-test/:agentId?', // agentId 是可选的
        name: 'AgentTestPage',
        component: AgentTestPage,
        meta: { topNav: 'agent-test' }, // 方便 Main.vue 识别
        props: true,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router