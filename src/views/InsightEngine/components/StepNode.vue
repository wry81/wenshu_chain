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
        <div v-else-if="safeNodeData.output?.text || (safeNodeData.output?.images && safeNodeData.output.images.length > 0)" class="generated-content-display">
          <div v-if="safeNodeData.output?.text" class="text-output-display">
            <div class="generated-text-content" v-html="renderedMarkdown"></div>
            <button class="copy-button" @click="copyTextOutput">复制</button>
          </div>

          <div v-if="safeNodeData.output?.images && safeNodeData.output.images.length > 0" class="image-output-display">
            <img :src="'data:image/png;base64,' + safeNodeData.output.images[0]" alt="Generated Image" />
          </div>
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
import { marked } from 'marked';

const props = defineProps({
  node: Object, // 确保 node prop 存在
  // activeNodeId 应该从父组件注入，这里不需要作为 prop
  // isActive: Boolean, // 如果需要高亮，应该在父组件NodeEdit.vue中通过 isActive prop 传递
});

const emit = defineEmits(['update-data', 'redo-node', 'download-result', 'continue-flow']);

// 关键改动：创建一个安全的 computed 属性来访问 node.data
// 如果 props.node 或 props.node.data 是 undefined，则返回一个包含默认值的空对象
const safeNodeData = computed(() => {
  const data = props.node?.data; // 使用可选链安全访问 data
  return data || {
    title: '加载中...',
    prompt: '',
    output: { text: '', images: [], error: null }, // 确保 output 结构完整
    status: 'idle',
    isInitialNode: false,
    // 默认值，如果 NodeEdit.vue 没有设置，这里提供一个 fallback
    // 在 NodeEdit.vue 中设置更严谨，这里只是兜底
    generationType: 'text',
  };
});

// 局部 ref 来绑定 textarea，解决 vue/no-mutating-props 错误
// 初始化时使用 safeNodeData
const internalPrompt = ref(safeNodeData.value.prompt);

// 监听 safeNodeData.prompt 的变化，更新 local ref
// 确保 watch 监听的是一个稳定的、可访问的属性
watch(internalPrompt, (newValue) => {
  // 添加一个安全检查，确保 props.node 存在后再执行
  if (props.node) {
    emit('update-data', { nodeId: props.node.id, key: 'prompt', value: newValue });
  }
});

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

const renderedMarkdown = computed(() => {
  if (safeNodeData.value.output?.text) {
    return marked.parse(safeNodeData.value.output.text);
  }
  return '';
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

const copyTextOutput = () => {
  if (safeNodeData.value.output?.text) {
    navigator.clipboard.writeText(safeNodeData.value.output.text)
      .then(() => {
        alert('文本已复制到剪贴板！');
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert('复制文本失败，请手动复制。');
      });
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
  display: flex; /* 让内部内容能够垂直排列 */
  flex-direction: column;
  justify-content: flex-start; /* 保持内容顶部对齐 */
  align-items: flex-start; /* 保持内容左对齐 */
  background-color: var(--color-neutral-light);
  padding: 10px;
  text-align: left; /* 确保文本左对齐 */
  gap: 10px; /* 文本和图片之间有间距 */
  overflow: hidden; /* 隐藏溢出内容，内部容器会滚动 */
}

/* loading, error, placeholder 的样式保持不变 */
.loading-indicator, .error-display, .placeholder {
  color: var(--color-description);
  width: 100%; /* 确保它们占据整个宽度 */
  text-align: center; /* 居中显示 */
  flex-grow: 1; /* 占据可用空间 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

/* 新增或修改的输出内容容器样式 */
.generated-content-display {
  width: 100%;
  display: flex;
  flex-direction: column; /* 文本和图片垂直排列 */
  gap: 10px; /* 文本和图片之间的间距 */
  overflow-y: auto; /* 允许这个总容器滚动 */
  flex-grow: 1; /* 占据 output-area 的剩余空间 */
}

.text-output-display {
  position: relative; /* 用于复制按钮定位 */
  padding-right: 30px; /* 为复制按钮留出空间 */
  box-sizing: border-box;
}

.generated-text-content {
  margin: 0;
  font-size: var(--font-size-body);
  color: var(--color-text-body);
  white-space: pre-wrap; /* 保持换行符和空格 */
  text-align: left;
  word-wrap: break-word; /* 防止长单词溢出 */
}

.copy-button {
  position: absolute;
  top: 0px; /* 与文本顶部对齐 */
  right: 0px;
  padding: 2px 5px;
  font-size: var(--font-size-small);
  background-color: var(--theme-color-40);
  border: 1px solid var(--color-divider);
  border-radius: var(--border-radius-small);
  cursor: pointer;
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.2s ease;
}

.text-output-display:hover .copy-button {
  opacity: 1; /* 鼠标悬停时显示 */
}


.image-output-display {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* max-height: 120px; */ /* 如果图片希望独立控制高度，可以在这里设置 */
}

.image-output-display img {
  max-width: 100%;
  max-height: 120px; /* 控制图片最大高度，防止过大 */
  object-fit: contain;
  border-radius: var(--border-radius-small);
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