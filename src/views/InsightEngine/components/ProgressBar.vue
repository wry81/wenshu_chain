<template>
  <div class="progress-bar">
    <div
      v-for="(node, index) in nodes"
      :key="node.id"
      class="progress-step"
      :class="{
        'progress-step-completed': node.data.status === 'success',
        'progress-step-active': node.id === currentNodeId,
        'progress-step-error': node.data.status === 'error',
      }"
      @click="emitJumpToNode(node.id)"
    >
      <div class="step-dot">
        <span v-if="node.data.status === 'success'">✔</span>
        <span v-else-if="node.data.status === 'error'">✖</span>
        <span v-else>{{ node.data.step }}</span>
      </div>
      <div class="step-label" :title="node.data.title">{{ node.data.step }}</div>
      <div v-if="index < nodes.length - 1" class="step-line"></div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'; // defineProps 不需要显式导入

// defineProps 在 <script setup> 中无需赋值给变量
defineProps({
  nodes: Array, // 传入所有步骤节点
  currentNodeId: String, // 当前激活的节点ID
});

const emit = defineEmits(['jump-to-node']);

const emitJumpToNode = (nodeId) => {
  emit('jump-to-node', nodeId);
};
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 10px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--color-neutral-light);
  border: 2px solid var(--color-divider);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--color-text-body);
  transition: all 0.3s ease;
}

.progress-step-completed .step-dot {
  background-color: #28a745; /* 绿色 */
  border-color: #28a745;
  color: #fff;
}

.progress-step-active .step-dot {
  background-color: var(--theme-color-primary);
  border-color: var(--theme-color-primary);
  color: #fff;
  transform: scale(1.1);
  box-shadow: 0 0 0 3px var(--theme-color-primary-light);
}

.progress-step-error .step-dot {
  background-color: #dc3545; /* 红色 */
  border-color: #dc3545;
  color: #fff;
}

.step-label {
  margin-top: 5px;
  font-size: var(--font-size-small);
  color: var(--color-text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px; /* 限制标签宽度 */
}

.step-line {
  height: 2px;
  width: 40px; /* 连线长度 */
  background-color: var(--color-divider);
  position: absolute;
  left: calc(100% + 12px); /* 定位在当前点右侧 */
  top: 12px; /* 与点垂直居中 */
  z-index: -1;
}

.progress-step-completed + .progress-step .step-line,
.progress-step-active + .progress-step .step-line {
  background-color: var(--theme-color-primary); /* 完成或激活后的连线颜色 */
}
</style>