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
                <div v-else class="output-content">{{ node.result }}</div>
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
      
      <button class="redoall-btn" @click="redoAllNodes">
        <span>全部重做</span>
      </button>
      
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

const route = useRoute();
const agentId = ref(route.params.agentId || 'default-agent');
const textareas = ref([]);
const nodeCards = ref([]);
const scrollContainer = ref(null);
let scrollTimeout = null;

const nodes = ref([
  {
    nodeId: 'step1_ip_breakdown',
    title: 'IP元素解构',
    prompt: '',
    placeholder: '深度分析现有IP的核心要素与市场定位, 提取DNA级特征标签...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step2_visual_prototype',
    title: '视觉原型生成',
    prompt: '',
    placeholder: '请输入想要生成的文旅IP视觉原型风格...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step3_dynamic_sticker',
    title: '动态表情包创作',
    prompt: '',
    placeholder: '将静态形象转化为系列表情动画, 自动生成眨眼/口型等基础动作视频...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step4_scene_extension',
    title: '场景化延展',
    prompt: '',
    placeholder: '生成IP在不同场景的应用效果图: 周边产品/海报/社交媒体模板等...',
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

// 判断文本是否为图片 URL
const isImageUrl = (text) => {
  return typeof text === 'string' && (text.startsWith('http') || text.startsWith('data:image'));
};

// 将后端返回的数据转换为可用的字符串
const normalizeApiResult = (apiData) => {
  if (!apiData) return '';
  let raw = apiData.result ?? apiData.data ?? '';
  if (Array.isArray(raw)) {
    raw = raw[0] ?? '';
  }
  if (typeof raw !== 'string') {
    raw = String(raw);
  }
  if (raw.startsWith('http') || raw.startsWith('data:image')) {
    return raw;
  }
  if (/^\/9j/.test(raw) || /^[A-Za-z0-9+/]+=*$/.test(raw)) {
    return `data:image/jpeg;base64,${raw}`;
  }
  return raw;
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
    const link = document.createElement('a');
    link.href = result;
    link.download = `节点${index + 1}_结果.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
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
    const resultToShow = normalizeApiResult(data);
    node.result = resultToShow || 'https://via.placeholder.com/1024x1024?text=AI+Generated+Image';
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

// 仅运行当前聚焦的节点
const runCurrentNode = () => {
  const currentIndex = focusedNodeIndex.value;
  if (nodes.value[currentIndex]) {
    callAgentApi(currentIndex);
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

.output-content {
  background: #f7f7f7;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  min-height: 100px;
  line-height: 1.6;
  text-align: left;
  word-wrap: break-word;
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
</style>