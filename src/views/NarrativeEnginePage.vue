<template>
  <div class="insight-engine-wrapper">
    <router-view />
  </div>
</template>

<script setup>
// 不需要导入 DashboardPage, SmartInsightPage, InsightHistoryPage
// 因为它们将由 <router-view /> 根据路由自动渲染

// 也不需要 defineProps，因为这个组件不再依赖父组件传递的 selectedInsightNav
// 如果 InsightEnginePage 自身需要一些数据或方法，可以在这里定义

</script>

<style scoped>
.insight-engine-wrapper {
  /* 洞察引擎页面的容器样式 */
  /* 这里的 padding 可以决定模块内容的整体内边距 */
  /* 如果希望子组件直接充满 Main.vue 的 main-content 区域，这里的 padding 可以是 0 */
  padding: 0;
  /* min-height 也可以根据需要调整，或者让子组件自己撑开 */
  /* min-height: calc(100vh - 60px); 减去顶部导航栏的高度，如果 MainLayout 已经处理了整体高度，这里可能不需要 */
  display: flex;
  flex-direction: column;
  /* 确保 InsightEnginePage 的背景也是透明的，如果你的 MainLayout 背景图片需要透过来 */
  background-color: transparent;
}

/* empty-state 样式如果不再需要可以移除，因为 <router-view> 会处理没有匹配到的情况 */
/* .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
} */
</style>