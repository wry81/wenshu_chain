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
      
      <button class="run-btn" @click="runAllNodes" :disabled="isAnyNodeLoading">
        <span v-if="isRunning">运行中...</span>
        <span v-else>运行全部节点</span>
      </button>

      <button class="runCurrent-btn" @click="runCurrentNode">
        <span v-if="nodes[focusedNodeIndex].loading">运行中...</span>
        <span v-else>运行当前节点</span>
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

const isImageUrl = (text) => {
  return typeof text === 'string' && (text.startsWith('http') || text.startsWith('data:image'));
};

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

    const resultToShow = normalizeApiResult(data);
    node.result = resultToShow;
    
    node.completed = true;

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

const isAnyNodeLoading = computed(() => {
  return nodes.value.some(node => node.loading);
});

const getNodeModalityType = (nodeId) => {
  const modalityMap = {
    'step1_culture_analysis': { input: 'text', output: 'text' },
    'step2_ip_generation': { input: 'text', output: 'image' },
    'step3_ip_setting': { input: 'image', output: 'text' },
    'step4_ip_image_iter': { input: 'text', output: 'image' },
    'step5_doc_generation': { input: 'text', output: 'text' }
  };
  return modalityMap[nodeId] || { input: 'text', output: 'text' };
};

const areModalitiesCompatible = (prevNodeId, nextNodeId) => {
  const prevModality = getNodeModalityType(prevNodeId);
  const nextModality = getNodeModalityType(nextNodeId);
  return prevModality.output === nextModality.input;
};

const transferDataBetweenNodes = (fromIndex, toIndex) => {
  const fromNode = nodes.value[fromIndex];
  const toNode = nodes.value[toIndex];
  
  if (!fromNode.result) return false;
  
  const fromModality = getNodeModalityType(fromNode.nodeId);
  const toModality = getNodeModalityType(toNode.nodeId);
  
  if (fromModality.output !== toModality.input) {
    console.log(`模态不匹配: ${fromModality.output} -> ${toModality.input}, 停止自动执行`);
    return false;
  }
  
  switch (toModality.input) {
    case 'text':
      if (isImageUrl(fromNode.result)) {
        console.log('前一个节点输出是图片，但下一个节点需要文本输入，需要用户手动处理');
        return false;
      } else {
        const nodePrompts = {
          'step3_ip_setting': `基于以下IP生成结果，请构建详细的IP设定：\n\n${fromNode.result}`,
          'step5_doc_generation': `基于以下所有分析和生成结果，请生成完整的IP创作文档：\n\n${fromNode.result}`
        };
        toNode.prompt = nodePrompts[toNode.nodeId] || fromNode.result;
      }
      break;
      
    case 'image':
      if (isImageUrl(fromNode.result)) {
        toNode.imageData = fromNode.result;
        const prompts = {
          'step3_ip_setting': '请基于上一步生成的IP图像，分析其特征并构建详细设定。',
          'step4_ip_image_iter': '请基于参考图像，进行IP形象的迭代设计。'
        };
        toNode.prompt = prompts[toNode.nodeId] || '请基于上一步生成的图片进行处理。';
      } else {
        console.log('前一个节点输出不是图片，无法传递给需要图像输入的节点');
        return false;
      }
      break;
      
    default:
      toNode.prompt = fromNode.result;
  }
  
  return true;
};

const runAllNodes = async () => {
  if (isRunning.value) return;
  
  isRunning.value = true;
  
  try {
    for (let i = 0; i < nodes.value.length; i++) {
      const node = nodes.value[i];
      
      await focusNode(i);
      
      if (i > 0) {
        const prevNode = nodes.value[i - 1];
        
        if (!prevNode.completed || !prevNode.result) {
          console.log(`前一个节点未完成，停止在节点 ${i}`);
          alert(`前一个节点未完成，自动执行停止在第${i + 1}个节点。`);
          break;
        }
        
        const isCompatible = areModalitiesCompatible(prevNode.nodeId, node.nodeId);
        if (!isCompatible) {
          const prevModality = getNodeModalityType(prevNode.nodeId);
          const currentModality = getNodeModalityType(node.nodeId);
          alert(`模态不匹配：第${i}个节点输出${prevModality.output}，但第${i + 1}个节点需要${currentModality.input}输入。请手动处理后继续。`);
          break;
        }
        
        const canTransfer = transferDataBetweenNodes(i - 1, i);
        if (!canTransfer) {
          console.log(`节点 ${i - 1} 到节点 ${i} 数据传递失败，需要用户手动输入`);
          alert(`数据传递失败，自动执行停止在第${i + 1}个节点。请手动输入内容后继续。`);
          break;
        }
        
        console.log(`数据已从节点 ${i} 传递到节点 ${i + 1}`);
      }
      
      if (!node.prompt.trim() && !node.imageData) {
        if (i === 0) {
          alert(`第${i + 1}个节点需要用户手动输入内容，请输入后重新运行。`);
        } else {
          alert(`第${i + 1}个节点无法自动获取输入，请手动输入内容后继续。`);
        }
        break;
      }
      
      node.result = '';
      node.completed = false;
      
      try {
        await callAgentApi(i);
        
        if (!node.completed || !node.result) {
          console.log(`节点 ${i} 执行失败，停止自动执行`);
          alert(`第${i + 1}个节点执行失败，停止自动执行。`);
          break;
        }
        
        const resultPreview = isImageUrl(node.result) ? '[图片生成完成]' : node.result.substring(0, 100) + '...';
        console.log(`节点 ${i} 执行完成，输出:`, resultPreview);
        
      } catch (error) {
        console.error(`节点 ${i} 执行失败:`, error);
        alert(`第${i + 1}个节点执行失败: ${error.message}`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (nodes.value.every(node => node.completed)) {
      alert('🎉 所有节点执行完成！叙事生成工作流已完成。');
    }
    
  } finally {
    isRunning.value = false;
  }
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
  position: relative;
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
  height: 700px; /* 固定高度 */
  max-height: 700px; /* 确保不超过600px */
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
  overflow-y: auto;
  max-height: calc(100% - 500px);
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

.output-content {
  padding: 15px;
  border: none;
  border-radius: 4px;
  line-height: 1.6;
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
  max-height: 50%;
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