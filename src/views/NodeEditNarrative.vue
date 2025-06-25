<!-- <template>
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
          <div class="node-title">{{ node.title }}</div>
          
          <template v-if="focusedNodeIndex === index">
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
              <div v-else-if="node.result" class="result-image-container">
                <img :src="node.result" alt="AI生成结果" class="result-image">
              </div>
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
          </template>
          <template v-else>
            <div class="collapsed-content">
              <p class="preview-text">
                {{ node.prompt ? (node.prompt.length > 50 ? node.prompt.slice(0, 50) + '...' : node.prompt) : '无内容' }}
              </p>
            </div>
          </template>
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

const route = useRoute();
const agentId = ref(route.params.agentId || 'default-agent');
const textareas = ref([]);
const nodeCards = ref([]);
const scrollContainer = ref(null);
let scrollTimeout = null;

const nodes = ref([
  {
    title: '文化元素分析',
    prompt: '',
    placeholder: '请输入想要分析的文化元素...',
    result: '',
    completed: false,
    loading: false
  },
  {
    title: '文旅IP生成',
    prompt: '',
    placeholder: '请输入想要生成的文旅IP...',
    result: '',
    completed: false,
    loading: false
  },
  {
    title: 'IP设定构建',
    prompt: '',
    placeholder: '请输入想要构建的IP设定...',
    result: '',
    completed: false,
    loading: false
  },
  {
    title: 'IP形象迭代',
    prompt: '',
    placeholder: '请输入内容...',
    result: '',
    completed: false,
    loading: false
  },
  {
    title: '文档生成',
    prompt: '',
    placeholder: '请输入总结内容...',
    result: '',
    completed: false,
    loading: false
  }
]);

const focusedNodeIndex = ref(0);
const isRunning = ref(false);

const trackStyle = computed(() => {
  return {
    width: `${nodes.value.length * 420}px`
  };
});

const scrollToNode = (index) => {
  nextTick(() => {
    const container = scrollContainer.value;
    const card = nodeCards.value[index];
    if (!container || !card) return;
    
    const scrollOffset = card.offsetHeight * 0.02;
    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const targetPosition = cardRect.left - containerRect.left - (containerRect.width / 2) + (cardRect.width / 2);
    
    container.scrollBy({
      left: targetPosition,
      top: -scrollOffset,
      behavior: 'smooth'
    });
  });
};

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

const handleTextareaFocus = (index) => {
  focusNode(index);
};

const focusNextNode = () => {
  if (focusedNodeIndex.value < nodes.value.length - 1) {
    focusNode(focusedNodeIndex.value + 1);
  }
};

const redoNode = (index) => {
  nodes.value[index].result = '';
  nodes.value[index].completed = false;
  focusNode(index);
};

const redoAllNodes = () => {
  nodes.value.forEach(node => {
    node.result = '';
    node.completed = false;
  });
  focusNode(0);
};

const downloadResult = (index) => {
  const result = nodes.value[index].result;
  if (!result) return;
  
  const link = document.createElement('a');
  link.href = result;
  link.download = `节点${index + 1}_结果.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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
    // 假设API返回图片URL
    node.result = data.imageUrl || 'https://via.placeholder.com/400x300?text=AI+Generated+Image';
    node.completed = true;
    return true;
  } catch (error) {
    node.result = `错误: ${error.message}`;
    throw error;
  } finally {
    node.loading = false;
  }
};

const runSingleNode = async (index) => {
  try {
    await callAgentApi(index);
    return true;
  } catch (error) {
    console.error('节点处理失败:', error);
    return false;
  }
};

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

const exitEditor = () => {
  console.log('退出编辑器');
};

onMounted(() => {
  focusNode(0);
  
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', () => {
      if (!nodeCards.value.length) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const container = scrollContainer.value;
        const scrollPosition = container.scrollLeft + container.clientWidth/2;
        
        nodeCards.value.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width/2 - container.getBoundingClientRect().left;
          
          if (Math.abs(scrollPosition - cardCenter) < 10) {
            focusedNodeIndex.value = index;
          }
        });
      }, 100);
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

.node-title {
  text-align: left;
  font-weight: 900;
  font-size: var(--font-size-h3);
  color: #000000;
}

.nodes-scroll-container {
  flex: 1;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
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
  padding: 0 calc(50% - 200px);
  min-height: 100%;
  box-sizing: content-box;
  transition: transform 1s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.node-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 25px;
  flex-shrink: 0;
  flex: 0 0 auto;
  transform-origin: center left;
  margin-top: 20px;
  margin-bottom: 20px;
  transition: transform 1s ease, box-shadow 1s ease;
  scroll-snap-align: center;
  position: relative;
}

.focused-node {
  transform: scale(1);
  border: var(--theme-color-40) solid 3px;
  width: 400px;
  min-height: 600px;
}

.collapsed-node {
  width: 200px !important;
  height: 300px !important;
  overflow: hidden;
}

.collapsed-content {
  height: calc(100% - 40px);
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

.loading-node {
  opacity: 0.8;
  pointer-events: none;
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

.result-image-container {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 6px;
  background: #f7f7f7;
}

.result-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-result {
  color: #999;
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

.task-bar {
  height: 80px;
  width: 520px;
  background-color: #fff;
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 30px;
  gap: 20px;
  flex-shrink: 0;
  margin: 20px auto 0;
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

  .nodes-scroll-container {
    padding: 40px calc(50% - 150px);
    align-items: flex-start;
  }
}
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
            'collapsed-node': focusedNodeIndex !== index,
            'loading-node': node.loading
          }"
          ref="nodeCards"
          @click="focusNode(index)"
        >
          <div class="node-title">{{ node.title }}</div>
          
          <template v-if="focusedNodeIndex === index">
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
              <template v-else-if="node.result">
                 <div v-if="isImageUrl(node.result)" class="result-image-container">
                  <img :src="node.result" alt="AI生成结果" class="result-image">
                </div>
                 <div v-else class="output-content" v-html="marked(node.result)"></div>
              </template>
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
          </template>
          <template v-else>
            <div class="collapsed-content">
              <p class="preview-text">
                {{ node.prompt ? (node.prompt.length > 50 ? node.prompt.slice(0, 50) + '...' : node.prompt) : '无内容' }}
              </p>
            </div>
          </template>
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
      
      <button class="run-btn" @click="runAllNodes">
        <span v-if="isRunning">运行中...</span>
        <span v-else>运行</span>
      </button>

      <button class="run-btn" @click="runCurrentNode">
        <span v-if="nodes[focusedNodeIndex].loading">运行中...</span>
        <span v-else>运行当前节点</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked'; // 1. 引入 marked 库

const route = useRoute();
const agentId = ref(route.params.agentId || 'default-agent');
const textareas = ref([]);
const nodeCards = ref([]);
const scrollContainer = ref(null);
let scrollTimeout = null;

const nodes = ref([
  // 2. 为每个节点添加 nodeId，与数据库中的工作流定义保持一致
  {
    nodeId: 'step1_culture_analysis',
    title: '文化元素分析',
    prompt: '',
    placeholder: '请输入想要分析的文化元素...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step2_ip_generation',
    title: '文旅IP生成',
    prompt: '',
    placeholder: '上一步的分析结果将自动作为输入...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step3_ip_setting',
    title: 'IP设定构建',
    prompt: '',
    placeholder: '上一步的IP概念将自动作为输入...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step4_ip_image_iter',
    title: 'IP形象迭代',
    prompt: '',
    placeholder: '上一步的IP设定将自动作为输入...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step5_doc_generation',
    title: '文档生成',
    prompt: '',
    placeholder: '整个工作流的结果将作为输入...',
    result: '',
    completed: false,
    loading: false
  }
]);

const focusedNodeIndex = ref(0);
const isRunning = ref(false);

const trackStyle = computed(() => {
  return {
    width: `${nodes.value.length * 420}px`
  };
});


// 3. 添加一个辅助函数来判断结果是否为图片URL
const isImageUrl = (text) => {
  // 这是一个简单的判断，可以根据实际返回的URL格式进行调整
  return typeof text === 'string' && (text.startsWith('http') || text.startsWith('data:image'));
};

// 将后端返回的数据统一解析为可用的字符串（DataURL / URL / Markdown）
const normalizeApiResult = (apiData) => {
  if (!apiData) return '';

  // 1) 兼容常见字段名：result 或 data
  let raw = apiData.result ?? apiData.data ?? '';

  // 2) 若为数组则取第一项
  if (Array.isArray(raw)) {
    raw = raw[0] ?? '';
  }

  // 3) 确保最终是字符串
  if (typeof raw !== 'string') {
    raw = String(raw);
  }

// 4) 已是 URL 或 Data-URL，直接返回
  if (raw.startsWith('http') || raw.startsWith('data:image')) {
    return raw;
  }

// 5) 裸 Base64（JPEG 通常以 /9j/ 开头）→ 转为 Data-URL
  if (/^\/9j/.test(raw) || /^[A-Za-z0-9+/]+=*$/.test(raw)) {
    return `data:image/jpeg;base64,${raw}`;
  }

  // 6) 其它情况视为普通文本 / Markdown
  return raw;
};

const scrollToNode = (index) => {
  nextTick(() => {
    const container = scrollContainer.value;
    const card = nodeCards.value[index];
    if (!container || !card) return;
    
    const scrollOffset = card.offsetHeight * 0.02;
    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const targetPosition = cardRect.left - containerRect.left - (containerRect.width / 2) + (cardRect.width / 2);
    
    container.scrollBy({
      left: targetPosition,
      top: -scrollOffset,
      behavior: 'smooth'
    });
  });
};

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

const handleTextareaFocus = (index) => {
  focusNode(index);
};

const focusNextNode = () => {
  if (focusedNodeIndex.value < nodes.value.length - 1) {
    focusNode(focusedNodeIndex.value + 1);
  }
};

const redoNode = (index) => {
  nodes.value[index].result = '';
  nodes.value[index].completed = false;
  focusNode(index);
};

const redoAllNodes = () => {
  nodes.value.forEach(node => {
    node.result = '';
    node.completed = false;
  });
  focusNode(0);
};

const downloadResult = (index) => {
  const result = nodes.value[index].result;
  if (!result) return;
  
  if (isImageUrl(result)) {
    // 下载图片
    const link = document.createElement('a');
    link.href = result;
    link.download = `节点${index + 1}_结果.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // 下载文本
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `节点${index + 1}_结果.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

const callAgentApi = async (nodeIndex) => {
  const node = nodes.value[nodeIndex];
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('请先登录');
    return;
  }
  
  if (!node.prompt.trim()) {
    alert('请输入 Prompt 内容！');
    return;
  }

  try {
    node.loading = true;
    const response = await fetch(`/api/agents/${agentId.value}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        input: node.prompt,
        nodeId: node.nodeId 
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || '请求失败');
    }
    
    const data = await response.json();

    // === 关键修改：处理并格式化Base64图片数据 ===
    const resultToShow = normalizeApiResult(data);
    node.result = resultToShow;
    // === 修改结束 ===
    
    node.completed = true;

    // 将上一步的结果（可能是Data URL）填充到下一个节点的prompt
    //if (nodeIndex + 1 < nodes.value.length) {
      // 为避免下一个节点输入过长，这里可以只传递提示信息
      //nodes.value[nodeIndex + 1].prompt = `[上一步生成了一张图片，请根据这张图片继续操作]`;
    //}

  } catch (error) {
    node.result = `[前端错误] ${error.message}`;
  } finally {
    node.loading = false;
  }
};

const runCurrentNode = () => {
  const currentIndex = focusedNodeIndex.value;
  if (nodes.value[currentIndex]) {
    callAgentApi(currentIndex);
  }
};

// const runSingleNode = async (index) => {
//   try {
//     await callAgentApi(index);
//     return true;
//   } catch (error) {
//     console.error('节点处理失败:', error);
//     return false;
//   }
// };

// const runAllNodes = async () => {
//   isRunning.value = true;
  
//   // 7. 优化“全部运行”逻辑，确保上一步结果能正确传递
//   for (let i = 0; i < nodes.value.length; i++) {
//     if (!nodes.value[i].completed) {
//       await focusNode(i);
//       const success = await runSingleNode(i);
//       if (!success) {
//         // 如果中途有节点失败，则停止执行
//         break;
//       }
//     }
//   }
  
//   isRunning.value = false;
// };

const exitEditor = () => {
  console.log('退出编辑器');
};

onMounted(() => {
  focusNode(0);
  
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', () => {
      if (!nodeCards.value.length) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const container = scrollContainer.value;
        const scrollPosition = container.scrollLeft + container.clientWidth/2;
        
        nodeCards.value.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width/2 - container.getBoundingClientRect().left;
          
          if (Math.abs(scrollPosition - cardCenter) < 10) {
            focusedNodeIndex.value = index;
          }
        });
      }, 100);
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

.node-title {
  text-align: left;
  font-weight: 900;
  font-size: var(--font-size-h3);
  color: #000000;
}

.nodes-scroll-container {
  flex: 1;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
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
  padding: 0 calc(50% - 200px);
  min-height: 100%;
  box-sizing: content-box;
  transition: transform 1s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.node-card {
  position: relative; /* 添加这行 */
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 25px;
  flex-shrink: 0;
  flex: 0 0 auto;
  transform-origin: center left;
  margin-top: 20px;
  margin-bottom: 20px;
  transition: transform 1s ease, box-shadow 1s ease;
  scroll-snap-align: center;
  position: relative;
}

.focused-node {
  transform: scale(1);
  border: var(--theme-color-40) solid 3px;
  width: 600px;
  height: 800px; /* 固定高度 */
  max-height: 800px; /* 确保不超过600px */
  position: relative;
}

.collapsed-node {
  width: 200px !important;
  height: 300px !important;
  overflow: hidden;
}

.collapsed-content {
  height: calc(100% - 40px);
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

.loading-node {
  opacity: 0.8;
  pointer-events: none;
}

.input-section {
  margin: 20px 0;
  margin-right: 20px;
  height: auto;
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
  min-height: 200px;
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
  padding-bottom: 80px;
  border-top: 1px solid #eee;
  overflow-y: auto; /* 允许内容滚动 */
  max-height: calc(100% - 500px); /* 根据父容器高度计算 */
}

.node-result h4 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #444;
}

.result-image-container {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 6px;
  background: transparent;
}

.result-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 8. 为渲染文本结果添加样式 */
.output-content {
  /* background: #f7f7f7; */
  padding: 15px;
  border: none;
  border-radius: 4px;
  /* min-height: 100px; */
  line-height: 1.6;
  text-align: left;
  white-space: pre-wrap; /* 保证文本能正常换行 */
  word-wrap: break-word;
  overflow-y: auto; /* 允许内容滚动 */
  max-height: 50%; /* 根据父容器高度计算 */
}

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
  /* background-color: #e0e0e0; */
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


.no-result {
  color: #999;
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
  z-index: 1; /* 确保在内容之上 */
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

.task-bar {
  height: 80px;
  width: 520px;
  background-color: #fff;
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 30px;
  gap: 20px;
  flex-shrink: 0;
  margin: 20px auto 0;
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

  .nodes-scroll-container {
    padding: 40px calc(50% - 150px);
    align-items: flex-start;
  }
}
</style>