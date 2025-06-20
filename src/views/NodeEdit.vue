<!-- <template>
  <div class="node-edit-page">
    <h2>节点编辑</h2>
    <p>当前编辑智能体ID: {{ agentId }}</p>

    <div class="single-node-card">
      <h3>我的第一个节点</h3>
      <div class="input-section">
        <label for="node-prompt">输入 Prompt:</label>
        <textarea
          id="node-prompt"
          v-model="nodePrompt"
          placeholder="请输入节点的 Prompt 内容..."
          rows="6"
        ></textarea>
      </div>
      <button @click="runNodeAgent" :disabled="loadingResult">
        <span v-if="loadingResult">运行中...</span>
        <span v-else>运行</span>
      </button>

      <div class="output-section">
        <h3>AI 返回结果:</h3>
        <div v-if="loadingResult" class="loading-indicator">
          <p>正在生成结果，请稍候...</p>
          <div class="spinner"></div>
        </div>
        <pre v-else-if="nodeResult">{{ nodeResult }}</pre>
        <p v-else class="no-result">点击“运行”按钮获取AI结果</p>
      </div>
    </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// 假设你有一个 apiService.js，如果还没有，请根据之前的建议创建它
// import apiService from '@/services/apiService';

const route = useRoute();
const agentId = ref(route.params.agentId || 'default-agent'); // 从路由获取 agentId，或设置默认值
const nodePrompt = ref(''); // 用于存储节点的 Prompt 内容
const nodeResult = ref(''); // 用于存储 AI 返回的结果
const loadingResult = ref(false); // 控制加载状态

// 模拟的 API 调用函数，替换为真实的 apiService 调用
const callAgentApi = async (agentId, prompt) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('用户未登录，请先登录。');
  }

  try {
    const response = await fetch(`/api/agents/${agentId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ input: prompt }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'API 请求失败');
    }
    const data = await response.json();
    return data.result || JSON.stringify(data); // 假设返回的数据结构
  } catch (error) {
    console.error('API 调用错误:', error);
    throw error; // 重新抛出错误以便上层捕获
  }
};


const runNodeAgent = async () => {
  if (!nodePrompt.value.trim()) {
    alert('请输入 Prompt 内容！');
    return;
  }

  loadingResult.value = true;
  nodeResult.value = ''; // 清空旧结果

  try {
    // 调用你的 API 服务
    // 如果你已经创建了 apiService.js，则可以这样调用：
    // const resultText = await apiService.generateAgentText(agentId.value, nodePrompt.value);
    
    // 否则，使用上面定义的模拟函数
    const resultText = await callAgentApi(agentId.value, nodePrompt.value);
    
    nodeResult.value = resultText;
  } catch (err) {
    nodeResult.value = `错误: ${err.message}`;
    alert(`操作失败: ${err.message}`); // 给用户更友好的提示
  } finally {
    loadingResult.value = false;
  }
};

onMounted(() => {
  // 可以在这里根据 agentId 加载节点的初始数据（如果需要的话）
  console.log(`NodeEdit.vue 页面加载，Agent ID: ${agentId.value}`);
});
</script>

<style scoped>
.node-edit-page {
  padding: 30px;
  background-color: var(--color-background, #fdf8f8); /* 使用你的CSS变量或提供默认值 */
  color: var(--color-text-body, #3b1d1d);
  min-height: calc(100vh - 60px); /* 确保页面有一定高度 */
  display: flex;
  flex-direction: column;
  align-items: center; /* 居中内容 */
}

h2 {
  font-size: var(--font-size-h2, 26px);
  color: var(--color-title, #1f0c0c);
  margin-bottom: 20px;
}

.single-node-card {
  background-color: var(--white-color, #ffffff);
  border-radius: var(--border-radius-large, 12px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 30px;
  width: 80%;
  max-width: 800px; /* 限制卡片宽度 */
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.single-node-card h3 {
  font-size: var(--font-size-h3, 18px);
  color: var(--color-title, #1f0c0c);
  margin-bottom: 15px;
  text-align: center;
}

.input-section label {
  display: block;
  font-size: var(--font-size-body, 14px);
  color: var(--color-text-body, #3b1d1d);
  margin-bottom: 8px;
  font-weight: 500;
}

.input-section textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--color-divider, #e9e9e9);
  border-radius: var(--border-radius-medium, 8px);
  font-size: var(--font-size-body, 14px);
  color: var(--color-text-body, #3b1d1d);
  resize: vertical; /* 允许垂直拖拽调整大小 */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.input-section textarea:focus {
  outline: none;
  border-color: var(--theme-color-40, #f8d6d6); /* 聚焦时边框颜色 */
  box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb, 255, 121, 121), 0.2); /* 聚焦时阴影 */
}

button {
  padding: 10px 20px;
  background-color: var(--theme-color-60, #ff7979); /* 主题色 */
  color: white;
  border: none;
  border-radius: var(--border-radius-medium, 8px);
  font-size: var(--font-size-body, 14px);
  cursor: pointer;
  transition: background-color 0.3s ease, opacity 0.3s ease;
  align-self: flex-end; /* 按钮靠右 */
}

button:hover {
  background-color: var(--theme-color-40, #f8d6d6); /* 悬停颜色 */
}

button:disabled {
  background-color: var(--color-neutral-mid-gray, #d0d0d0); /* 禁用颜色 */
  cursor: not-allowed;
  opacity: 0.8;
}

.output-section {
  margin-top: 20px;
  border-top: 1px solid var(--color-divider, #e9e9e9);
  padding-top: 20px;
}

.output-section h3 {
  font-size: var(--font-size-body, 14px);
  color: var(--color-title, #1f0c0c);
  margin-bottom: 10px;
}

.output-section pre {
  background: var(--color-neutral-light, #f7f7f7);
  padding: 15px;
  border-radius: var(--border-radius-small, 6px);
  white-space: pre-wrap; /* 保持换行，但不溢出 */
  word-wrap: break-word; /* 长单词也换行 */
  font-family: 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: var(--font-size-body, 14px);
  color: var(--color-text-body, #3b1d1d);
  max-height: 300px; /* 限制高度，可滚动 */
  overflow-y: auto;
}

.no-result {
  color: var(--color-description, #ad8888);
  font-style: italic;
  text-align: center;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-description, #ad8888);
}

/* 简单的CSS spinner */
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--theme-color-60, #ff7979);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 调试信息样式 (如果启用) */
/* .debug-info {
  margin-top: 40px;
  padding: 20px;
  background-color: #f0f8ff;
  border: 1px dashed #c0d9ec;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  font-family: monospace;
  color: #333;
} */
</style> -->
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
            'loading-node': node.loading
          }"
          ref="nodeCards"
          @click="focusNode(index)"
        >
          <h3>{{ node.title || `节点 ${index + 1}` }}</h3>
          
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
            <h4>AI 返回结果:</h4>
            <div v-if="node.loading" class="loading-indicator">
              <p>正在生成结果，请稍候...</p>
              <div class="spinner"></div>
            </div>
            <pre v-else-if="node.result">{{ node.result }}</pre>
            <p v-else class="no-result">点击"运行"按钮获取AI结果</p>
          </div>

          <div class="node-actions">
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
        </div>
      </div>
    </div>

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
      
      <button class="global-btn run-btn" @click="runAllNodes">
        <span v-if="isRunning">运行中...</span>
        <span v-else>运行</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const agentId = ref(route.params.agentId || 'default-agent');
const textareas = ref([]);
const nodeCards = ref([]);
const scrollContainer = ref(null);

// 节点数据
const nodes = ref(Array(5).fill().map((_, i) => ({
  title: `节点 ${i + 1}`,
  prompt: '',
  placeholder: '请输入文字',
  result: '',
  completed: false,
  loading: false
})));

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
const scrollToNode = (index) => {
  if (!scrollContainer.value || !nodeCards.value[index]) return;
  
  const container = scrollContainer.value;
  const card = nodeCards.value[index];
  const containerWidth = container.clientWidth;
  const cardWidth = card.clientWidth;
  
  // 计算目标滚动位置
  const scrollTo = card.offsetLeft - (containerWidth / 2) + (cardWidth / 2);
  
  // 平滑滚动
  container.scrollTo({
    left: scrollTo,
    behavior: 'smooth'
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
      
      const container = scrollContainer.value;
      const containerCenter = container.scrollLeft + (container.clientWidth / 2);
      
      // 找出最接近中心的节点
      let closestNodeIndex = 0;
      let smallestDistance = Infinity;
      
      nodeCards.value.forEach((card, index) => {
        const cardCenter = card.offsetLeft + (card.clientWidth / 2);
        const distance = Math.abs(containerCenter - cardCenter);
        
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestNodeIndex = index;
        }
      });
      
      if (focusedNodeIndex.value !== closestNodeIndex) {
        focusedNodeIndex.value = closestNodeIndex;
      }
    });
  }
});
</script>

<style scoped>
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
  padding: 20px 0;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
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
  gap: 20px;
  padding: 0 50%;
  min-height: 100%;
}

.node-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 25px;
  width: 400px;
  min-height: 600px;
  flex-shrink: 0;
  transition: all 0.3s ease;
  scroll-snap-align: center;
  position: relative;
}

.focused-node {
  box-shadow: 0 0 0 3px #4a90e2;
  transform: scale(1.02);
}

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
  margin-bottom: 20px;
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

.node-result pre {
  background: #f7f7f7;
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
}

.no-result {
  color: #999;
  font-style: italic;
  text-align: center;
  margin-top: 20px;
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

.download-btn{
  padding: 8px 40px;
  border: 1px solid var(--theme-color-60);
  border-radius: 999px;
  background-color: #fff;
  color: var(--theme-color-60);
  cursor: pointer;
  font-size: var(--font-size-body);
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
  width: 1000px;
  background-color: #fff;
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-soft);
  display: flex;
  align-items: center;
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
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ddd;
  cursor: pointer;
  transition: all 0.2s;
}

.progress-dot:hover {
  transform: scale(1.2);
}

.active-dot {
  background-color: #4a90e2;
  transform: scale(1.2);
}

.completed-dot {
  background-color: #4CAF50;
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
  padding: 12px 20px;
  border: none;
  border-radius: 16px;
  background-color: var(--color-divider);
  color: var(--color-text-body);
  cursor: pointer;
  font-size: var(--font-size-body);
}

.exit-btn:hover {
  background-color: #f1b0b7;
}

.redoall-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 16px;
  background-color: var(--color-divider);
  color: var(--color-text-body);
  cursor: pointer;
  font-size: var(--font-size-body);
}

.run-btn {
  background-color: #4a90e2;
  color: white;
}

.run-btn:hover {
  background-color: #3a7bc8;
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
}
</style>