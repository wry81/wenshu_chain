<!-- eslint-disable no-unused-vars -->
<template>
  <div class="insight-engine-wrapper">
    <DashboardPage v-if="selectedInsightNav === 'dashboard'" />
    <SmartInsightPage v-else-if="selectedInsightNav === 'smart-insight'" />
    <InsightHistoryPage v-else-if="selectedInsightNav === 'insight-history'" />
    <div v-else class="empty-state">
      <a-empty description="请从左侧选择功能" />
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
// 导入路径需要根据新的文件结构进行调整
import DashboardPage from './InsightEngine/DashboardPage.vue';
import SmartInsightPage from './InsightEngine/SmartInsightPage.vue';
import InsightHistoryPage from './InsightEngine/InsightHistoryPage.vue';

// 定义接收来自父组件 (MainLayout.vue) 的 props
// eslint-disable-next-line no-unused-vars
const props = defineProps({
  selectedInsightNav: {
    type: String,
    default: 'dashboard' // 默认显示仪表盘
  }
});
</script>

<style scoped>
.insight-engine-wrapper {
  /* 洞察引擎页面的容器样式 */
  padding: 0; /* 内容由内部组件控制，这里可以作为整体模块的布局或背景 */
  min-height: calc(100vh - 64px - 48px); /* 减去顶部导航和一些可能的上下边距 */
  display: flex; /* 确保内容居中或适当布局 */
  flex-direction: column;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1; /* 占据剩余空间 */
  background-color: white; /* 保持一致的背景色 */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>