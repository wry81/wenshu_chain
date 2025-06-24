<template>
  <div class="node-edit-page">
    <div class="nodes-scroll-container" ref="scrollContainer">
      <div class="nodes-track" :style="trackStyle">
        <div 
          v-for="(node, index) in nodes" 
          :key="index"
          class="node-card"
          :class="{ 
            'focused-node': focusedNodeIndex === index,
            'collapsed-node': focusedNodeIndex !== index,
            'loading-node': node.loading
          }"
          ref="nodeCards"
          @click="focusNode(index)"
        >
          <div class="node-title">{{ node.title }}</div>  <!-- 直接显示预设的标题 -->
          
          <template v-if="focusedNodeIndex === index">
            <!-- 完整内容（聚焦状态） -->
            <div class="input-section">
              <label>输入 Prompt:</label>
              <textarea
                v-model="node.prompt"
                :placeholder="node.placeholder || '请输入文字'"
                rows="6"
                ref="textareas"
                @focus="handleTextareaFocus(index)"
                :disabled="node.loading"
              ></textarea>
            </div>

            <div class="node-result">
              <h4>返回结果:</h4>
              <div v-if="node.loading" class="loading-indicator">
                <p>正在生成结果，请稍候...</p>
                <div class="spinner"></div>
              </div>
              <div v-else-if="node.result" class="output-content" v-html="marked(node.result)"></div>
              <p v-else class="no-result">点击"运行"按钮获取AI结果</p>
            </div>

            <div class="node-actions">
              <!-- 操作按钮保持不变 -->
                <button 
                class="redo-btn" 
                @click.stop="redoNode(index)"
                :disabled="node.loading"
              >
                <span>重做</span>
              </button>
              <button 
                class="download-btn" 
                @click.stop="downloadResult(index)"
                :disabled="!node.result || node.loading"
              >
                <span>下载结果</span>
              </button>
              <button 
                class="continue-btn" 
                @click.stop="focusNextNode"
                :disabled="index === nodes.length - 1 || node.loading"
              >
                <span>继续</span>
              </button>
            </div>
          </template>
          <template v-else>
            <!-- 折叠内容（非聚焦状态） -->
            <div class="collapsed-content">
              <p class="preview-text">
                {{ node.prompt ? (node.prompt.length > 50 ? node.prompt.slice(0, 50) + '...' : node.prompt) : '无内容' }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 任务栏保持不变 -->
    <div class="task-bar">
      <button class="exit-btn" @click="exitEditor">
        <span>退出</span>
      </button>
      
      <div class="progress-indicator">
        <div 
          v-for="(node, index) in nodes" 
          :key="'progress-'+index"
          class="progress-dot"
          :class="{ 
            'active-dot': focusedNodeIndex === index,
            'completed-dot': node.completed
          }"
          @click="focusNode(index)"
        ></div>
      </div>
      
      <button class="redoall-btn" @click="redoAllNodes">
        <span>全部重做</span>
      </button>
      
      <button class="run-btn" @click="runAllNodes">
        <span v-if="isRunning">运行中...</span>
        <span v-else>运行</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked'; 

const route = useRoute();
const agentId = ref(route.params.agentId || 'default-agent');
const textareas = ref([]);
const nodeCards = ref([]);
const scrollContainer = ref(null);
let scrollTimeout = null;

const nodes = ref([
  {
    title: '主题选择',  // 预设标题1
    prompt: '',
    placeholder: '请输入相关主题...',
    result: '',
    completed: false,
    loading: false
  },
  {
    title: '社媒热点分析',  // 预设标题2
    prompt: '',
    placeholder: '社交媒体热点词汇抓取与分析...',
    result: '',
    completed: false,
    loading: false
  },
  {
    title: '竞品调研',  // 预设标题3
    prompt: '',
    placeholder: '请输入竞品...',
    result: '',
    completed: false,
    loading: false
  },
  {
    title: '现状挑战与机遇',  // 预设标题4
    prompt: '',
    placeholder: '请输入内容...',
    result: '',
    completed: false,
    loading: false
  },
  {
    title: '文档生成',  // 预设标题5
    prompt: '',
    placeholder: '请输入总结内容...',
    result: '',
    completed: false,
    loading: false
  }
]);

// 截断文本方法
const truncateText = (text) => {
  if (!text) return '无内容';
  return text.length > 50 ? text.slice(0, 50) + '...' : text;
};


const focusedNodeIndex = ref(0);
const isRunning = ref(false);

// 计算是否有任何节点正在加载
const isAnyNodeLoading = computed(() => {
  return nodes.value.some(node => node.loading);
});

// 计算轨道宽度
const trackStyle = computed(() => {
  return {
    width: `${nodes.value.length * 420}px` // 每个节点400px宽度 + 20px间距
  };
});

// 滚动到指定节点
// 修改scrollToNode方法
const scrollToNode = (index) => {
  nextTick(() => {
    const container = scrollContainer.value;
    const card = nodeCards.value[index];
    if (!container || !card) return;
    
    // 计算需要额外滚动的距离（考虑放大效果）
    const scrollOffset = card.offsetHeight * 0.02; // 放大2%的高度
    
    // 使用scrollBy实现精确控制
    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const targetPosition = cardRect.left - containerRect.left - (containerRect.width / 2) + (cardRect.width / 2);
    
    container.scrollBy({
      left: targetPosition,
      top: -scrollOffset, // 向上滚动抵消放大高度
      behavior: 'smooth'
    });
  });
};

// 聚焦到指定节点
const focusNode = async (index) => {
  if (index >= 0 && index < nodes.value.length) {
    focusedNodeIndex.value = index;
    await nextTick();
    scrollToNode(index);
    if (textareas.value[index]) {
      textareas.value[index].focus();
    }
  }
};

// 处理textarea获取焦点事件
const handleTextareaFocus = (index) => {
  focusNode(index);
};

// 聚焦到下一个节点
const focusNextNode = () => {
  if (focusedNodeIndex.value < nodes.value.length - 1) {
    focusNode(focusedNodeIndex.value + 1);
  }
};

// 重做当前节点
const redoNode = (index) => {
  nodes.value[index].result = '';
  nodes.value[index].completed = false;
  focusNode(index);
};

// 重做所有节点
const redoAllNodes = () => {
  nodes.value.forEach(node => {
    node.result = '';
    node.completed = false;
  });
  focusNode(0);
};

// 下载节点结果
const downloadResult = (index) => {
  const result = nodes.value[index].result;
  if (!result) return;
  
  const blob = new Blob([result], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `节点${index + 1}_结果.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 调用后端API
const callAgentApi = async (nodeIndex) => {
  const node = nodes.value[nodeIndex];
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('请先登录');
  }
  
  if (!node.prompt.trim()) {
    throw new Error('请输入 Prompt 内容！');
  }

  try {
    node.loading = true;
    const response = await fetch(`/api/agents/${agentId.value}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ input: node.prompt }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || '请求失败');
    }
    
    const data = await response.json();
    node.result = data.result || JSON.stringify(data);
    node.completed = true;
    return true;
  } catch (error) {
    node.result = `错误: ${error.message}`;
    throw error;
  } finally {
    node.loading = false;
  }
};

// 运行单个节点
const runSingleNode = async (index) => {
  try {
    await callAgentApi(index);
    return true;
  } catch (error) {
    console.error('节点处理失败:', error);
    return false;
  }
};

// 运行所有节点
const runAllNodes = async () => {
  isRunning.value = true;
  
  for (let i = 0; i < nodes.value.length; i++) {
    if (!nodes.value[i].completed) {
      await focusNode(i);
      const success = await runSingleNode(i);
      if (!success) break;
    }
  }
  
  isRunning.value = false;
};

// 退出编辑器
const exitEditor = () => {
  console.log('退出编辑器');
  // 实际项目中这里可以添加路由跳转或其他退出逻辑
};

onMounted(() => {
  focusNode(0);
  
  // 监听滚动事件，实现更精确的节点焦点检测
  if (scrollContainer.value) {
  scrollContainer.value.addEventListener('scroll', () => {
    if (!nodeCards.value.length) return;
    
    // 只在滚动停止后检测（防抖）
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const container = scrollContainer.value;
      const scrollPosition = container.scrollLeft + container.clientWidth/2;
      
      // 使用getBoundingClientRect获取精确位置
      nodeCards.value.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width/2 - container.getBoundingClientRect().left;
        
        if (Math.abs(scrollPosition - cardCenter) < 10) { // 10px容差
          focusedNodeIndex.value = index;
        }
      });
    }, 100); // 100ms后认为滚动停止
  });
}
});
</script>

<style scoped>
.node-title {
  text-align: left; /* 左对齐 */
  font-weight: 900; /* 加粗 */
  font-size: var(--font-size-h3); /* 使用全局变量 */
  color: #000000;
}

.node-edit-page {
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 90vh;
}

h2 {
  font-size: var(--font-size-h2); /* H2 / 标题 / 26px */
  font-weight: 600;
  color: var(--color-title); /* 标题颜色 1F0C0C */
  margin-bottom: 10px;
}

.nodes-scroll-container {
  flex: 1;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  /* padding: 20px calc(50% - 200px); 动态计算内边距 */
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scroll-padding: 0 calc(50% - 200px);
}

.nodes-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.nodes-scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.nodes-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.nodes-track {
  display: flex;
  gap: 100px;
  padding: 0 calc(50% - 200px); /* 添加对称内边距 */
  min-height: 100%;
  box-sizing: content-box; /* 确保内边距计入宽度 */
  transition: transform 1s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.node-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 25px;
  flex-shrink: 0;
  flex: 0 0 auto;
  transform-origin: center left; /* 从顶部中心缩放 */
  margin-top: 20px; /* 为放大留出空间 */
  margin-bottom: 20px; /* 保持底部间距 */
  transition: transform 1s ease, box-shadow 1s ease; /* 平滑过渡 */
  scroll-snap-align: center;
  position: relative;
}

.focused-node {
  /* transform: scale(1.02) translateY(-10px); 上移10px避免遮挡 */
  /* box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); 调整阴影 */
  transform: scale(1);
  border: var(--theme-color-40) solid 3px;
  width: 400px;
  min-height: 600px;
}

/* 折叠卡片样式 */
.collapsed-node {
  width: 200px !important;
  height: 300px !important;
  overflow: hidden;
}

/* 折叠内容样式 */
.collapsed-content {
  height: calc(100% - 40px); /* 减去标题高度 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-text {
  font-size: 12px;
  color: #666;
  margin-top: 10px;
  word-break: break-word;
}

/* 输入框调整 */
/* .input-section textarea {
  width: calc(100% - 20px);
  margin: 0 10px;
} */

.loading-node {
  opacity: 0.8;
  pointer-events: none;
}

.node-card h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #444;
  text-align: center;
}

.input-section {
  margin: 20px 0;
  margin-right: 20px;
}

.input-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.input-section textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #F6F5F5;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
}

.input-section textarea:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
}

.input-section textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 移除或注释掉原有的 .node-result pre 样式 */

.node-result {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  min-height: 200px;
}

.node-result h4 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #444;
}

/* .node-result pre {
  background: #f7f7f7;
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
} */

.no-result {
  color: #999;
  /* font-style: italic; */
  text-align: center;
  margin-top: 20px;
}

.output-content {
  background: #f7f7f7;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  min-height: 100px;
  /* 确保 Markdown 样式被正确应用 */
  line-height: 1.6;
  text-align: left;
}

/* 覆盖 v-html 内部可能生成的元素的默认样式 */
.output-content :deep(h1),
.output-content :deep(h2),
.output-content :deep(h3) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}
.output-content :deep(p) {
  margin-bottom: 1em;
}
.output-content :deep(ul),
.output-content :deep(ol) {
  padding-left: 2em;
}
.output-content :deep(code) {
  background-color: #e0e0e0;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}
.output-content :deep(pre) {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}
.output-content :deep(pre) code {
    background-color: transparent;
    padding: 0;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #666;
  height: 150px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #4a90e2;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.node-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  position: absolute;
  bottom: 20px;
  right: 20px;
  left: 20px;
}

.redo-btn{
  padding: 8px 40px;
  border: none;
  border-radius: 999px;
  background-color: var(--color-divider);
  color: var(--color-text-body);
  cursor: pointer;
  font-size: var(--font-size-body);
}

.redo-btn:hover {
  background-color: var(--color-neutral-light-gray);
}

.download-btn{
  padding: 8px 40px;
  border: 1px solid var(--theme-color-60);
  border-radius: 999px;
  background-color: #fff;
  color: var(--theme-color-60);
  cursor: pointer;
  font-size: var(--font-size-body);
}

.download-btn:hover {
  background-color: var(--theme-color-20);
}

.continue-btn{
  padding: 8px 40px;
  border: none;
  border-radius: 999px;
  background-color: var(--theme-color-60);
  color: #fff;
  cursor: pointer;
  font-size: var(--font-size-body);
}

.continue-btn:hover{
  background-color: #cb6666;
}
.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  background-color: var(--color-divider);
  color: #333;
  cursor: pointer;
}

.action-btn:hover {
  background-color: #e0e0e0;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-bar {
  height: 80px;
  width: 520px;
  background-color: #fff;
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center; /* 新增：使内容整体居中 */
  padding: 0 30px;
  gap: 20px;
  flex-shrink: 0;
  margin: 20px auto 0; /* 修改这里 - 上下20px，左右auto */
}

.progress-indicator {
  display: flex;
  gap: 15px;
}

.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #D9D9D9;
  cursor: pointer;
  transition: all 0.2s;
}

.progress-dot:hover {
  transform: scale(1.2);
}

.active-dot {
  background-color: #013E77;
  transform: scale(1.5);
}

.completed-dot {
  background-color: #11C31D;
}

.global-actions {
  display: flex;
  gap: 15px;
}

.global-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.global-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.exit-btn {
  padding: 15px 25px;
  border: none;
  border-radius: 16px;
  background-color: var(--color-divider);
  color: var(--color-text-body);
  cursor: pointer;
  font-size: var(--font-size-body);
}

.exit-btn:hover {
  background-color: var(--color-neutral-light-gray);
}

.redoall-btn {
  padding: 15px 30px;
  border: 1px solid var(--theme-color-60);
  border-radius: 16px;
  background-color: #fff;
  color: var(--theme-color-60);
  cursor: pointer;
  font-size: var(--font-size-body);
}

.redoall-btn:hover {
  background-color: var(--theme-color-20);
}

.run-btn {
  padding: 15px 40px;
  border: none;
  border-radius: 16px;
  background-color: var(--theme-color-60);
  color: #fff;
  cursor: pointer;
  font-size: var(--font-size-body);
}

.run-btn:hover {
  background-color: #cb6666;
}

@media (max-width: 768px) {
  .node-card {
    width: 300px;
    min-height: 500px;
  }
  
  .nodes-track {
    gap: 15px;
  }
  
  .global-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .nodes-scroll-container {
    padding: 40px calc(50% - 150px); /* 小屏幕调整 */
    align-items: flex-start; /* 顶部对齐 */
  }
}

</style>