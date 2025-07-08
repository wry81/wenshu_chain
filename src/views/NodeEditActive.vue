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
              <!-- 在第一个节点和第三个节点添加图片上传 -->
              <div v-if="index === 0 || index === 2" class="image-upload-section">
                <div class="upload-area" @click="triggerFileInput">
                  <div v-if="!node.imageData" class="upload-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 13V19H5V13H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V13H19ZM13 5L11.59 6.41L13.17 8H5V10H13.17L11.58 11.59L13 13L17 9L13 5Z" fill="#4A90E2"/>
                    </svg>
                    <p>点击上传图片</p>
                  </div>
                  <img v-else :src="node.imageData" alt="上传的图片" class="preview-image">
                  <input 
                    type="file" 
                    :ref="el => { if (el) fileInputs[index] = el }"
                    accept="image/*"
                    style="display: none"
                    @change="(event) => handleImageUpload(event, index)"
                  >
                </div>
                <button 
                  v-if="node.imageData" 
                  class="clear-image-btn" 
                  @click.stop="clearUploadedImage(index)"
                >
                  清除图片
                </button>
              </div>
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
                 <div v-else-if="isModelUrl(node.result)" class="result-model-container">
                  <div class="model-preview">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M32 8L56 20V44L32 56L8 44V20L32 8Z" stroke="#4A90E2" stroke-width="2" fill="none"/>
                      <path d="M32 8V32L56 20" stroke="#4A90E2" stroke-width="2" fill="none"/>
                      <path d="M32 32L8 20" stroke="#4A90E2" stroke-width="2" fill="none"/>
                      <path d="M32 32V56" stroke="#4A90E2" stroke-width="2" fill="none"/>
                    </svg>
                    <p>3D模型已生成</p>
                    <a :href="node.result" target="_blank" class="model-link">查看/下载模型</a>
                  </div>
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
const fileInputs = ref([]); // 用于存储所有文件输入
const getFileInput = () => fileInputs.value[focusedNodeIndex.value]; // 获取当前节点的文件输入

const triggerFileInput = () => {
  const input = getFileInput();
  if (input) input.click();
};

const handleImageUpload = (event, nodeIndex) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    // 保存图片的base64数据到对应节点
    nodes.value[nodeIndex].imageData = e.target.result;
    // 根据节点设置默认提示词
    if (!nodes.value[nodeIndex].prompt || nodes.value[nodeIndex].prompt.startsWith('[上传图片:')) {
      if (nodeIndex === 0) {
        nodes.value[nodeIndex].prompt = '请描述这张图片的内容';
      } else if (nodeIndex === 2) {
        nodes.value[nodeIndex].prompt = '请将这张图片转换为3D模型';
      }
    }
  };
  reader.readAsDataURL(file);
};

const clearUploadedImage = (nodeIndex) => {
  if (fileInputs.value[nodeIndex]) {
    fileInputs.value[nodeIndex].value = '';
  }
  nodes.value[nodeIndex].imageData = null;
  nodes.value[nodeIndex].prompt = '';
};

const nodes = ref([
  {
    nodeId: 'step1_narrative_background',
    title: 'IP元素叙事背景生成',
    prompt: '',
    placeholder: '深度分析现有 IP 的文化内涵与叙事潜力，构建完整的背景故事框架',
    result: '',
    completed: false,
    loading: false,
    imageData: null
  },
  {
    nodeId: 'step2_visual_prototype',
    title: '视觉原型生成',
    prompt: '',
    placeholder: '基于叙事背景，生成具有文化特色的文旅 IP 视觉原型设计',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step3_creative_product',
    title: '文创产品生成',
    prompt: '',
    placeholder: '将IP形象转化为3D文创产品模型，适用于纪念品、玩具、装饰品等商业应用',
    result: '',
    completed: false,
    loading: false,
    imageData: null
  },
  {
    nodeId: 'step4_scenario_extension',
    title: '场景化延展',
    prompt: '',
    placeholder: '生成 IP 在不同场景的应用效果图：周边产品/海报/社交媒体模板等',
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


// 3. 添加辅助函数来判断结果类型
const isImageUrl = (text) => {
  // 这是一个简单的判断，可以根据实际返回的URL格式进行调整
  return typeof text === 'string' && (text.startsWith('http') || text.startsWith('data:image'));
};

// 添加3D模型识别函数
const isModelUrl = (text) => {
  return typeof text === 'string' && (
    text.includes('.glb') || 
    text.includes('.obj') || 
    text.includes('.fbx') ||
    text.includes('model') ||
    text.includes('3d')
  );
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
  } else if (isModelUrl(result)) {
    // 下载3D模型
    const link = document.createElement('a');
    link.href = result;
    // 从URL中提取文件扩展名
    const extension = result.includes('.glb') ? '.glb' : 
                     result.includes('.obj') ? '.obj' : 
                     result.includes('.fbx') ? '.fbx' : '.glb';
    link.download = `节点${index + 1}_3D模型${extension}`;
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
  
  if (!node.prompt.trim() && !node.imageData) {
    alert('请输入 Prompt 内容或上传图片！');
    return;
  }

  try {
    node.loading = true;
    
    // 构建请求体
    let requestBody = { 
      nodeId: node.nodeId 
    };
    
    if (node.imageData) {
      // 如果有图片数据，传递图片数据作为input，提示词作为额外参数
      requestBody.input = node.imageData;
      requestBody.prompt = node.prompt;
    } else {
      // 如果没有图片，只传递文本
      requestBody.input = node.prompt;
    }
    
    const response = await fetch(`/api/agents/${agentId.value}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
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

const isAnyNodeLoading = computed(() => {
  return nodes.value.some(node => node.loading);
});

// 节点模态类型判断
const getNodeModalityType = (nodeId) => {
  // 根据节点ID判断其输入/输出模态类型
  const modalityMap = {
    'step1_decompose': { input: 'multimodal', output: 'text' },        // 多模态输入，文本输出
    'step2_visual_prototype': { input: 'text', output: 'image' },      // 文本输入，图像输出
    'step3_dynamic_emojis': { input: 'image', output: 'video' },       // 图像输入，视频输出
    'step4_scenario_extension': { input: 'text', output: 'image' }     // 文本输入，图像输出
  };
  return modalityMap[nodeId] || { input: 'text', output: 'text' };
};

// 检查两个节点的模态是否兼容
const areModalitiesCompatible = (prevNodeId, nextNodeId) => {
  const prevModality = getNodeModalityType(prevNodeId);
  const nextModality = getNodeModalityType(nextNodeId);
  return prevModality.output === nextModality.input;
};

// 智能数据传递：将前一个节点的输出适配到下一个节点的输入
const transferDataBetweenNodes = (fromIndex, toIndex) => {
  const fromNode = nodes.value[fromIndex];
  const toNode = nodes.value[toIndex];
  
  if (!fromNode.result) return false;
  
  const fromModality = getNodeModalityType(fromNode.nodeId);
  const toModality = getNodeModalityType(toNode.nodeId);
  
  // 检查模态兼容性
  if (fromModality.output !== toModality.input) {
    console.log(`模态不匹配: ${fromModality.output} -> ${toModality.input}, 停止自动执行`);
    return false;
  }
  
  // 根据模态类型传递数据
  switch (toModality.input) {
    case 'text':
      // 如果下一个节点需要文本输入
      if (isImageUrl(fromNode.result)) {
        // 如果前一个节点输出是图片，生成描述性文本
        toNode.prompt = `请基于上一步生成的图片继续处理。`;
      } else {
        // 如果前一个节点输出是文本，直接传递
        toNode.prompt = fromNode.result;
      }
      break;
      
    case 'image':
      // 如果下一个节点需要图像输入
      if (isImageUrl(fromNode.result)) {
        toNode.imageData = fromNode.result;
        toNode.prompt = '请基于上一步生成的图片进行处理。';
      } else {
        console.log('前一个节点输出不是图片，无法传递给需要图像输入的节点');
        return false;
      }
      break;
      
    case 'video':
      // 如果下一个节点需要视频输入
      if (fromNode.result.includes('.mp4') || fromNode.result.includes('video')) {
        toNode.videoData = fromNode.result;
        toNode.prompt = '请基于上一步生成的视频进行处理。';
      } else {
        console.log('前一个节点输出不是视频，无法传递给需要视频输入的节点');
        return false;
      }
      break;
      
    case 'multimodal':
      // 多模态输入节点通常不需要自动传递，由用户手动输入
      return false;
      
    default:
      toNode.prompt = fromNode.result;
  }
  
  return true;
};

const runAllNodes = async () => {
  if (isRunning.value) return;
  if (isRunning.value) return;
  
  isRunning.value = true;
  
  try {
    for (let i = 0; i < nodes.value.length; i++) {
      const node = nodes.value[i];
      
      // 自动聚焦到当前节点
      await focusNode(i);
      
      // 如果不是第一个节点，尝试从前一个节点传递数据
      if (i > 0) {
        const prevNode = nodes.value[i - 1];
        
        // 检查前一个节点是否已完成
        if (!prevNode.completed || !prevNode.result) {
          console.log(`前一个节点未完成，停止在节点 ${i}`);
          break;
        }
        
        // 尝试传递数据
        const canTransfer = transferDataBetweenNodes(i - 1, i);
        if (!canTransfer) {
          console.log(`节点 ${i - 1} 到节点 ${i} 数据传递失败，需要用户手动输入`);
          // 模态不匹配或传递失败，停止自动执行
          alert(`模态不匹配或需要用户输入，自动执行停止在第${i + 1}个节点。请手动输入内容后继续。`);
          break;
        }
      }
      
      // 检查当前节点是否有输入内容
      if (!node.prompt.trim() && !node.imageData) {
        if (i === 0) {
          alert(`第${i + 1}个节点需要用户手动输入内容，请输入后重新运行。`);
        } else {
          alert(`第${i + 1}个节点无法自动获取输入，请手动输入内容后继续。`);
        }
        break;
      }
      
      // 重置节点状态
      // 如果不是第一个节点，尝试从前一个节点传递数据
      if (i > 0) {
        const prevNode = nodes.value[i - 1];
        
        // 检查前一个节点是否已完成
        if (!prevNode.completed || !prevNode.result) {
          console.log(`前一个节点未完成，停止在节点 ${i}`);
          break;
        }
        
        // 尝试传递数据
        const canTransfer = transferDataBetweenNodes(i - 1, i);
        if (!canTransfer) {
          console.log(`节点 ${i - 1} 到节点 ${i} 数据传递失败，需要用户手动输入`);
          // 模态不匹配或传递失败，停止自动执行
          alert(`模态不匹配或需要用户输入，自动执行停止在第${i + 1}个节点。请手动输入内容后继续。`);
          break;
        }
      }
      
      // 检查当前节点是否有输入内容
      if (!node.prompt.trim() && !node.imageData) {
        if (i === 0) {
          alert(`第${i + 1}个节点需要用户手动输入内容，请输入后重新运行。`);
        } else {
          alert(`第${i + 1}个节点无法自动获取输入，请手动输入内容后继续。`);
        }
        break;
      }
      
      // 重置节点状态
      node.result = '';
      node.completed = false;
      
      // 执行当前节点
      try {
        await callAgentApi(i);
        
        // 检查执行是否成功
        if (!node.completed || !node.result) {
          console.log(`节点 ${i} 执行失败，停止自动执行`);
          break;
        }
        
        console.log(`节点 ${i} 执行完成，输出:`, node.result.substring(0, 100) + '...');
        
        
        // 检查执行是否成功
        if (!node.completed || !node.result) {
          console.log(`节点 ${i} 执行失败，停止自动执行`);
          break;
        }
        
        console.log(`节点 ${i} 执行完成，输出:`, node.result.substring(0, 100) + '...');
        
      } catch (error) {
        console.error(`节点 ${i} 执行失败:`, error);
        alert(`第${i + 1}个节点执行失败: ${error.message}`);
        break;
      }
      
      // 添加短暂延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 添加短暂延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 所有节点执行完成
    if (nodes.value.every(node => node.completed)) {
      alert('🎉 所有节点执行完成！多模态创作工作流已完成。');
    }
    
    
    // 所有节点执行完成
    if (nodes.value.every(node => node.completed)) {
      alert('🎉 所有节点执行完成！多模态创作工作流已完成。');
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

.result-model-container {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.model-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.model-preview p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.model-link {
  color: #4A90E2;
  text-decoration: none;
  font-size: 14px;
  padding: 6px 12px;
  border: 1px solid #4A90E2;
  border-radius: 4px;
  transition: all 0.3s;
}

.model-link:hover {
  background-color: #4A90E2;
  color: white;
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
  width: 650px;
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

.run-btn:disabled {
  opacity: 0.7;
  background-color: var(--theme-color-40) !important;
  cursor: not-allowed;
}

.image-upload-section {
  margin-bottom: 15px;
}
/* 上传图片样式 */
.upload-area {
  width: 100%;
  height: 150px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.3s;
  margin-bottom: 10px;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #4a90e2;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
}

.upload-placeholder svg {
  margin-bottom: 8px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.clear-image-btn {
  padding: 6px 12px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.clear-image-btn:hover {
  background-color: #ff7875;
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