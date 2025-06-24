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

// InsightEngine 子页面
import DashboardPage from '../views/InsightEngine/DashboardPage.vue';
import SmartInsightPage from '../views/InsightEngine/SmartInsightPage.vue';
import HistoryPage from '../views/InsightEngine/InsightHistoryPage.vue';
import NodeEdit from '../views/NodeEdit.vue';

// 新增：NarrativeEngine 子页面
import SmartGen from '../views/NarrativeEnginePage/SmartGen.vue'; // 新建文件
import GenHistory from '../views/NarrativeEnginePage/GenHistory.vue'; // 新建文件
import NodeEditNarrative from '../views/NodeEditNarrative.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/agent-test/:agentId?', component: AgentTestPage, props: true },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  {
    path: '/main',
    component: Main,
    redirect: '/main/insight-engine/dashboard',
    children: [
      // 洞察引擎（原有配置）
      {
        path: 'insight-engine',
        component: InsightEnginePage,
        meta: { topNav: 'insight-engine' },
        redirect: '/main/insight-engine/dashboard',
        children: [
          { path: 'dashboard', component: DashboardPage },
          { path: 'smart-insight', component: SmartInsightPage },
          { 
            path: 'smart-insight/:agentId/editor', 
            component: NodeEdit, 
            props: true 
          },
          { path: 'history', component: HistoryPage },
        ]
      },
      // 叙事生成引擎（新增子路由）
      {
        path: 'narrative-engine',
        component: NarrativeEnginePage,
        meta: { topNav: 'narrative-engine' },
        redirect: '/main/narrative-engine/smart-generation', // 默认重定向到智能生成
        children: [
          { 
            path: 'smart-generation', 
            component: SmartGen,
            meta: { sidebarNav: 'smart-generation' } // 用于侧边栏高亮
          },
          { 
            path: 'smart-generation/:agentId/editor', 
            component: NodeEditNarrative, 
            props: true 
          },
          { 
            path: 'generation-history', 
            component: GenHistory,
            meta: { sidebarNav: 'generation-history' }
          }
        ]
      },
      // 其他引擎（保持不变）
      {
        path: 'ip-activation-engine',
        component: IPActivationEnginePage,
        meta: { topNav: 'ip-activation-engine' },
      },
      {
        path: 'knowledge-base',
        component: KnowledgeBasePage,
        meta: { topNav: 'knowledge-base' },
      },
      {
        path: 'agent-test/:agentId?',
        component: AgentTestPage,
        meta: { topNav: 'agent-test' },
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