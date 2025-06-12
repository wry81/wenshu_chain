<template>
  <div class="step-node" :class="{ 'node-active': node?.id === activeNodeId }">
    <Handle type="target" :position="Position.Left" />

    <div class="node-header">
      <h3>{{ safeNodeData.title || '无标题步骤' }}</h3>
      <span class="node-status" :class="`status-${safeNodeData.status}`">{{ displayStatus }}</span>
    </div>

    <div class="node-content">
      <label>Prompt:</label>
      <textarea
        v-model="internalPrompt"
        @input="emitUpdateData('prompt', internalPrompt)"
        placeholder="输入Prompt..."
        rows="3"
      ></textarea>

      <label>Output:</label>
      <div class="output-area">
        <div v-if="safeNodeData.status === 'loading'" class="loading-indicator">
          <div class="spinner"></div>
          <p>生成中...</p>
        </div>
        <div v-else-if="safeNodeData.status === 'error'" class="error-display">
          <p class="error-text">错误: {{ safeNodeData.output?.error || '未知错误' }}</p>
        </div>
        <div v-else-if="safeNodeData.output?.images && safeNodeData.output.images.length > 0" class="image-display">
          <img :src="'data:image/png;base64,' + safeNodeData.output.images[0]" alt="Generated Image" />
          <p v-if="safeNodeData.output.text" class="output-text">{{ safeNodeData.output.text }}</p>
        </div>
        <div v-else class="placeholder">
          <p>等待生成内容...</p>
        </div>
      </div>
    </div>

    <div class="node-actions">
      <button @click="emitRedo" :disabled="safeNodeData.status === 'loading'">重做</button>
      <button @click="emitDownload" :disabled="!safeNodeData.output?.images || safeNodeData.output.images.length === 0">下载结果</button>
      <button @click="emitContinue" :disabled="safeNodeData.status !== 'success' && !safeNodeData.isInitialNode">继续</button>
    </div>

    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, inject, computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps({
  node: Object, // 确保 node prop 存在
});

const emit = defineEmits(['update-data', 'redo-node', 'download-result', 'continue-flow']);

// 关键改动：创建一个安全的 computed 属性来访问 node.data
// 如果 props.node 或 props.node.data 是 undefined，则返回一个包含默认值的空对象
const safeNodeData = computed(() => {
  const data = props.node?.data; // 使用可选链安全访问 data
  return data || {
    title: '加载中...',
    prompt: '',
    output: { text: '', images: [], error: null },
    status: 'idle',
    isInitialNode: false,
  };
});

// 局部 ref 来绑定 textarea，解决 vue/no-mutating-props 错误
// 初始化时使用 safeNodeData
const internalPrompt = ref(safeNodeData.value.prompt);

// 监听 safeNodeData.prompt 的变化，更新 local ref
// 确保 watch 监听的是一个稳定的、可访问的属性
watch(() => safeNodeData.value.prompt, (newVal) => {
  internalPrompt.value = newVal;
}, { immediate: true }); // 立即执行一次，确保初始化

// 注入父组件的 activeNodeId
const activeNodeId = inject('activeNodeId', null); // 确保在模板中使用了 activeNodeId

const displayStatus = computed(() => {
  switch (safeNodeData.value.status) {
    case 'idle': return '未开始';
    case 'loading': return '生成中';
    case 'success': return '成功';
    case 'error': return '失败';
    default: return '未知'; // 添加默认状态
  }
});

const emitUpdateData = (key, value) => {
  // 确保在发送事件时，node.id 是存在的
  if (props.node?.id) {
    emit('update-data', { nodeId: props.node.id, key, value });
  } else {
    console.warn("Attempted to update data for an undefined node.", props.node);
  }
};

const emitRedo = () => {
  if (props.node?.id) {
    emit('redo-node', props.node.id);
  } else {
    console.warn("Attempted to redo an undefined node.", props.node);
  }
};

const emitDownload = () => {
  if (props.node?.id) {
    emit('download-result', props.node.id);
  } else {
    console.warn("Attempted to download result for an undefined node.", props.node);
  }
};

const emitContinue = () => {
  if (props.node?.id) {
    emit('continue-flow', props.node.id);
  } else {
    console.warn("Attempted to continue flow from an undefined node.", props.node);
  }
};
</script>

<style scoped>
/* 样式保持不变，因为它们在功能上没有问题 */
.step-node {
  border: 1px solid var(--color-divider);
  border-radius: var(--border-radius-medium);
  overflow: hidden; /* 确保内容在节点内部 */
  display: flex;
  flex-direction: column;
  background-color: #fff;
  width: 100%;
  height: 100%; /* 充满 VueFlow 提供的尺寸 */
  position: relative;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.node-active {
  border-color: var(--theme-color-primary);
  box-shadow: 0 0 0 2px var(--theme-color-primary-light);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: var(--theme-color-40); /* 浅主题色作为头部背景 */
  border-bottom: 1px solid var(--color-divider);
}

.node-header h3 {
  margin: 0;
  font-size: var(--font-size-h3); /* 小标题 18px */
  color: var(--color-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.node-status {
  padding: 4px 8px;
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-small); /* 12px */
  font-weight: 500;
  color: #fff;
}

.status-idle { background-color: var(--color-neutral-mid-gray); } /* 929292 */
.status-loading { background-color: #ffc107; } /* 警告色 */
.status-success { background-color: #28a745; } /* 成功色 */
.status-error { background-color: #dc3545; } /* 错误色 */

.node-content {
  padding: 15px;
  flex-grow: 1;
  overflow-y: auto; /* 内容过多时滚动 */
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node-content label {
  font-size: var(--font-size-body);
  font-weight: 500;
  color: var(--color-text-body);
}

.node-content textarea {
  width: calc(100% - 16px); /* 减去 padding */
  padding: 8px;
  border: 1px solid var(--color-divider);
  border-radius: var(--border-radius-small);
  resize: vertical;
  min-height: 60px;
  font-size: var(--font-size-body);
  color: var(--color-text-body);
  background-color: var(--white-color);
}

.output-area {
  min-height: 100px;
  border: 1px dashed var(--color-divider);
  border-radius: var(--border-radius-small);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--color-neutral-light);
  padding: 10px;
  text-align: center;
}

.loading-indicator, .error-display, .placeholder {
  color: var(--color-description);
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--theme-color-primary);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin: 0 auto 5px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-text {
  color: #dc3545; /* 红色错误提示 */
  font-weight: 500;
}

.image-display img {
  max-width: 100%;
  max-height: 80px; /* 控制预览图大小 */
  object-fit: contain;
  border-radius: var(--border-radius-small);
  margin-bottom: 5px;
}

.output-text {
  font-size: var(--font-size-small);
  color: var(--color-text-body);
  max-height: 40px; /* 限制文本高度 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.node-actions {
  display: flex;
  justify-content: space-around;
  padding: 10px 15px;
  border-top: 1px solid var(--color-divider);
  background-color: var(--white-color);
}

.node-actions button {
  padding: 8px 12px;
  border: 1px solid var(--color-divider);
  border-radius: var(--border-radius-small);
  background-color: transparent;
  color: var(--color-text-body);
  cursor: pointer;
  font-size: var(--font-size-small);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.node-actions button:hover:not(:disabled) {
  background-color: var(--theme-color-40);
  color: var(--color-text-body);
}

.node-actions button:disabled {
  background-color: var(--color-neutral-light);
  color: var(--color-description);
  cursor: not-allowed;
}
</style>