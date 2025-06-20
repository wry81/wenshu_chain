<template>
  <div class="custom-node" @click="emit('open-editor', node)">
    <div class="node-header">
      <h4>{{ node.data.label || '新节点' }}</h4>
      <el-button link size="small" @click.stop="emit('open-editor', node)">编辑</el-button>
    </div>
    <div class="node-content">
      <p>Prompt: {{ node.data.prompt ? (node.data.prompt.length > 20 ? node.data.prompt.substring(0, 20) + '...' : node.data.prompt) : '未设置' }}</p>
      <p v-if="node.data.result">结果: 已生成</p>
      <p v-else-if="node.data.loading">结果: 加载中...</p>
      <p v-else>结果: 待运行</p>
    </div>

    <Handle type="source" :position="Position.Right" />
    <Handle type="target" :position="Position.Left" />
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core';
import { ElButton } from 'element-plus';

const props = defineProps({
  // node prop 此时会接收到 Vue Flow 传递的整个节点对象
  // 也就是说，`props.node` 就是 `{ id, type, position, data, ... }`
  node: {
    type: Object,
    required: true,
  },
});

// 这个 console.log 非常重要，它能帮你确认实际接收到的 `node` prop 是什么结构
console.log('CustomNode received props:', props.node);

const emit = defineEmits(['open-editor']); // 声明 emit 事件
</script>

<style scoped>
.custom-node {
  border: 1px solid var(--color-divider, #e9e9e9);
  border-radius: var(--border-radius-medium, 8px);
  background-color: var(--white-color, #ffffff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 10px 15px;
  min-width: 200px;
  max-width: 250px;
  cursor: grab;
  text-align: left;
  display: flex;
  flex-direction: column;
  position: relative; /* For Handle positioning */

  min-height: 80px; /* 例如，给一个最小高度 */
  width: 220px; /* 例如，给一个固定宽度 */
  box-sizing: border-box; /* 确保 padding 和 border 包含在宽度内 */
}

.custom-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px dashed var(--color-divider, #e9e9e9);
  padding-bottom: 5px;
}

.node-header h4 {
  margin: 0;
  font-size: var(--font-size-body, 14px);
  color: var(--color-title, #1f0c0c);
  font-weight: 600;
}

.node-content p {
  font-size: var(--font-size-small, 12px);
  color: var(--color-description, #ad8888);
  margin: 4px 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Vue Flow Handle 样式覆盖 */
.vue-flow__handle {
  width: 10px;
  height: 10px;
  background: var(--theme-color-60, #ff7979);
  border: 1px solid white;
  box-shadow: 0 0 0 2px var(--theme-color-40, #f8d6d6);
}
</style>