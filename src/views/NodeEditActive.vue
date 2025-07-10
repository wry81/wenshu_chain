<template>
  <div class="node-edit-page">
    <div
      ref="scrollContainer"
      class="nodes-scroll-container"
    >
      <div
        class="nodes-track"
        :style="trackStyle"
      >
        <div 
          v-for="(node, index) in nodes" 
          :key="index"
          ref="nodeCards"
          class="node-card"
          :class="{ 
            'focused-node': focusedNodeIndex === index,
            'collapsed-node': focusedNodeIndex !== index,
            'loading-node': node.loading
          }"
          @click="focusNode(index)"
        >
          <div class="node-title">
            {{ node.title }}
          </div>  <!-- 直接显示预设的标题 -->
          
          <template v-if="focusedNodeIndex === index">
            <div class="input-section">
              <label>输入 Prompt:</label>
              <!-- 在第一个节点和第三个节点添加图片上传 -->
              <div
                v-if="index === 0 || index === 2"
                class="image-upload-section"
              >
                <div
                  class="upload-area"
                  @click="triggerFileInput"
                >
                  <div
                    v-if="!node.imageData"
                    class="upload-placeholder"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 13V19H5V13H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V13H19ZM13 5L11.59 6.41L13.17 8H5V10H13.17L11.58 11.59L13 13L17 9L13 5Z"
                        fill="#4A90E2"
                      />
                    </svg>
                    <p>点击上传图片</p>
                  </div>
                  <img
                    v-else
                    :src="node.imageData"
                    alt="上传的图片"
                    class="preview-image"
                  >
                  <input 
                    :ref="el => { if (el) fileInputs[index] = el }"
                    type="file"
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
                ref="textareas"
                v-model="node.prompt"
                :placeholder="node.placeholder || '请输入文字'"
                rows="6"
                :disabled="node.loading"
                @focus="handleTextareaFocus(index)"
                @input="(event) => adjustTextareaHeight(event.target)"
              />
            </div>

            <div class="node-result">
              <h4>返回结果:</h4>
              <div
                v-if="node.loading"
                class="loading-indicator"
              >
                <p>正在生成结果，请稍候...</p>
                <div class="spinner" />
              </div>
              <template v-else-if="node.result">
                <div
                  v-if="isImageUrl(node.result)"
                  class="result-image-container"
                >
                  <img
                    :src="node.result"
                    alt="AI生成结果"
                    class="result-image"
                  >
                </div>
                <div
                  v-else-if="isAsyncTask(node.result)"
                  class="result-async-task-container"
                >
                  <div class="async-task-preview">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke="#4A90E2"
                        stroke-width="2"
                        fill="none"
                      />
                      <path
                        d="M32 16v16l12 8"
                        stroke="#4A90E2"
                        stroke-width="2"
                        fill="none"
                      />
                    </svg>
                    <div class="async-task-info">
                      <pre>{{ node.result }}</pre>
                    </div>
                    <div class="async-task-actions">
                      <button 
                        class="task-status-btn" 
                        :disabled="node.checkingStatus"
                        @click="checkTaskStatus(index)"
                      >
                        <span v-if="node.checkingStatus">查询中...</span>
                        <span v-else>查询状态</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  v-else-if="isCompleted3DTask(node.result)"
                  class="result-completed-3d-container"
                >
                  <div class="completed-3d-preview">
                    <!-- 显示缩略图 -->
                    <div
                      v-if="JSON.parse(node.result).thumbnailUrl"
                      class="thumbnail-container"
                    >
                      <img 
                        :src="JSON.parse(node.result).thumbnailUrl" 
                        alt="3D模型预览"
                        class="thumbnail-image"
                        @error="onThumbnailError"
                      >
                      <div class="thumbnail-overlay">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 64 64"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M32 8L56 20V44L32 56L8 44V20L32 8Z"
                            stroke="#ffffff"
                            stroke-width="2"
                            fill="none"
                          />
                          <path
                            d="M32 8V32L56 20"
                            stroke="#ffffff"
                            stroke-width="2"
                            fill="none"
                          />
                          <path
                            d="M32 32L8 20"
                            stroke="#ffffff"
                            stroke-width="2"
                            fill="none"
                          />
                          <path
                            d="M32 32V56"
                            stroke="#ffffff"
                            stroke-width="2"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </div>
                    
                    <!-- 3D模型信息 -->
                    <div class="model-info">
                      <h3>✅ 3D模型生成完成</h3>
                      <p>{{ JSON.parse(node.result).message }}</p>
                      
                      <!-- 操作按钮 -->
                      <div class="model-actions">
                        <button 
                          v-if="JSON.parse(node.result).modelUrl"
                          class="download-model-btn"
                          @click="downloadModel(JSON.parse(node.result).modelUrl)"
                        >
                          📦 下载3D模型
                        </button>
                        <button 
                          v-if="JSON.parse(node.result).thumbnailUrl"
                          class="download-thumbnail-btn"
                          @click="downloadThumbnail(JSON.parse(node.result).thumbnailUrl)"
                        >
                          🖼️ 下载预览图
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="isModelUrl(node.result)"
                  class="result-model-container"
                >
                  <div class="model-preview">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M32 8L56 20V44L32 56L8 44V20L32 8Z"
                        stroke="#4A90E2"
                        stroke-width="2"
                        fill="none"
                      />
                      <path
                        d="M32 8V32L56 20"
                        stroke="#4A90E2"
                        stroke-width="2"
                        fill="none"
                      />
                      <path
                        d="M32 32L8 20"
                        stroke="#4A90E2"
                        stroke-width="2"
                        fill="none"
                      />
                      <path
                        d="M32 32V56"
                        stroke="#4A90E2"
                        stroke-width="2"
                        fill="none"
                      />
                    </svg>
                    <p>3D模型已生成</p>
                    <a
                      :href="node.result"
                      target="_blank"
                      class="model-link"
                    >查看/下载模型</a>
                  </div>
                </div>
                <!-- 强制兜底方案：必须在v-else之前，检查任务相关关键词 -->
                <div
                  v-else-if="node.result.includes('task_id') || node.result.includes('任务ID') || node.result.includes('task-') || node.result.includes('正在处理') || node.result.includes('334cddfe')"
                  class="result-async-task-container"
                >
                  <div class="async-task-preview">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke="#4A90E2"
                        stroke-width="2"
                        fill="none"
                      />
                      <path
                        d="M32 16v16l12 8"
                        stroke="#4A90E2"
                        stroke-width="2"
                        fill="none"
                      />
                    </svg>
                    <div class="async-task-info">
                      <pre>{{ node.result }}</pre>
                    </div>
                    <div class="async-task-actions">
                      <button 
                        class="task-status-btn" 
                        :disabled="node.checkingStatus"
                        @click="checkTaskStatus(index)"
                      >
                        <span v-if="node.checkingStatus">查询中...</span>
                        <span v-else>查询状态</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="output-content"
                  v-html="marked(node.result)"
                />
              </template>
              <p
                v-else
                class="no-result"
              >
                点击"运行"按钮获取AI结果
              </p>
            </div>

            <div class="node-actions">
              <!-- 操作按钮保持不变 -->
              <button 
                class="redo-btn" 
                :disabled="node.loading"
                @click.stop="redoNode(index)"
              >
                <span>重做</span>
              </button>
              <button 
                class="download-btn" 
                :disabled="!node.result || node.loading"
                @click.stop="downloadResult(index)"
              >
                <span>下载结果</span>
              </button>
              <button 
                class="continue-btn" 
                :disabled="index === nodes.length - 1 || node.loading"
                @click.stop="focusNextNode"
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
          <div
            v-if="index < nodes.length - 1"
            class="node-connector"
          />
        </div>
      </div>
    </div>

    <!-- 任务栏保持不变 -->
    <div class="task-bar">
      <button
        class="exit-btn"
        @click="exitEditor"
      >
        <span>退出</span>
      </button>
      
      <div class="progress-indicator">
        <div class="progress-line" />
        <div 
          v-for="(node, index) in nodes" 
          :key="'progress-'+index"
          class="progress-dot"
          :class="{ 
            'active-dot': focusedNodeIndex === index,
            'completed-dot': node.completed
          }"
          @click="focusNode(index)"
        />
      </div>
      
      <button 
        class="run-btn" 
        :disabled="isAnyNodeLoading"
        @click="runAllNodes"
      >
        <span v-if="isRunning">运行中...</span>
        <span v-else>运行全部</span>
      </button>
      <button
        class="runCurrent-btn"
        @click="runCurrentNode"
      >
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
        nodes.value[nodeIndex].prompt = '请分析这张图片中的文化元素和IP潜力';
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
    imageData: null,
    checkingStatus: false
  },
  {
    nodeId: 'step2_visual_prototype',
    title: '视觉原型生成',
    prompt: '',
    placeholder: '基于叙事背景，生成具有文化特色的文旅 IP 视觉原型设计',
    result: '',
    completed: false,
    loading: false,
    checkingStatus: false
  },
  {
    nodeId: 'step3_creative_product',
    title: '文创产品生成',
    prompt: '',
    placeholder: '将IP形象转化为3D文创产品模型，适用于纪念品、玩具、装饰品等商业应用',
    result: '',
    completed: false,
    loading: false,
    imageData: null,
    checkingStatus: false
  },
  {
    nodeId: 'step4_scenario_extension',
    title: '场景化延展',
    prompt: '',
    placeholder: '生成 IP 在不同场景的应用效果图：周边产品/海报/社交媒体模板等',
    result: '',
    completed: false,
    loading: false,
    checkingStatus: false
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


// 3. 添加辅助函数来判断结果类型
const isImageUrl = (text) => {
  // 这是一个简单的判断，可以根据实际返回的URL格式进行调整
  return typeof text === 'string' && (text.startsWith('http') || text.startsWith('data:image'));
};

// 添加异步任务识别函数
const isAsyncTask = (text) => {
  if (typeof text !== 'string') return false;
  
  // 检查是否包含异步任务的标识符
  if (text.includes('🔄') && text.includes('任务ID')) {
    return true;
  }
  
  // 检查是否包含其他可能的异步任务标识
  if (text.includes('task_id') || text.includes('任务已提交') || text.includes('正在处理中')) {
    return true;
  }
  
  // 检查是否为JSON格式的异步任务信息
  try {
    const parsed = JSON.parse(text);
    if (parsed.type === 'async_task' || parsed.task_id) {
      return true;
    }
  } catch (e) {
    // JSON解析失败是正常的，因为很多结果不是JSON格式
  }
  
  return false;
};

// 添加完成的3D任务识别函数
const isCompleted3DTask = (text) => {
  if (typeof text !== 'string') return false;
  
  try {
    const parsed = JSON.parse(text);
    return parsed.type === 'completed_3d_task';
  } catch (e) {
    return false;
  }
};

// 添加3D模型识别函数
const isModelUrl = (text) => {
  // 如果是异步任务或完成的3D任务，不认为是普通模型URL
  if (isAsyncTask(text) || isCompleted3DTask(text)) {
    return false;
  }
  
  return typeof text === 'string' && (
    text.includes('.glb') || 
    text.includes('.obj') || 
    text.includes('.fbx') ||
    (text.startsWith('http') && (text.includes('model') || text.includes('3d')))
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

  // 4) 检查是否为异步任务信息（JSON字符串）
  if (raw.startsWith('{') && (raw.includes('async_task') || raw.includes('task_id'))) {
    try {
      const taskInfo = JSON.parse(raw);
      if (taskInfo.type === 'async_task' || taskInfo.task_id) {
        const formatResult = `🔄 ${taskInfo.message || '3D模型生成任务已提交'}\n\n📋 任务ID: ${taskInfo.task_id}\n📡 状态: ${taskInfo.status || 'processing'}\n\n💡 ${taskInfo.note || '3D模型生成通常需要1-5分钟，请耐心等待。'}\n\n⚠️ 注意：监控端点需要API密钥认证，不能直接在浏览器中访问。`;
        return formatResult;
      }
    } catch (e) {
      console.warn('解析异步任务信息失败:', e);
    }
  }

  // 5) 已是 URL 或 Data-URL，直接返回
  if (raw.startsWith('http') || raw.startsWith('data:image')) {
    return raw;
  }

  // 6) 裸 Base64（JPEG 通常以 /9j/ 开头）→ 转为 Data-URL
  if (/^\/9j/.test(raw) || /^[A-Za-z0-9+/]+=*$/.test(raw)) {
    return `data:image/jpeg;base64,${raw}`;
  }

  // 7) 其它情况视为普通文本 / Markdown
  return raw;
};

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

// 添加textarea自动高度调整功能
const adjustTextareaHeight = (textarea) => {
  if (!textarea) return;
  
  // 先设置为auto以获取内容的实际高度
  textarea.style.height = 'auto';
  
  // 获取计算样式
  const computedStyle = getComputedStyle(textarea);
  const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
  const paddingTop = parseFloat(computedStyle.paddingTop) || 12;
  const paddingBottom = parseFloat(computedStyle.paddingBottom) || 12;
  const borderTop = parseFloat(computedStyle.borderTopWidth) || 1;
  const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 1;
  
  // 计算基础高度（padding + border）
  const baseHeight = paddingTop + paddingBottom + borderTop + borderBottom;
  
  // 计算单行高度和最大8行高度
  const singleLineHeight = lineHeight + baseHeight;
  const maxLines = 8;
  const maxHeight = lineHeight * maxLines + baseHeight;
  
  // 获取内容实际需要的高度
  const scrollHeight = textarea.scrollHeight;
  
  // 如果没有内容或只有空白，显示单行高度
  if (!textarea.value.trim()) {
    textarea.style.height = singleLineHeight + 'px';
    return;
  }
  
  // 根据内容计算需要的高度，但不超过最大值
  const newHeight = Math.min(scrollHeight, maxHeight);
  textarea.style.height = newHeight + 'px';
  
  // 如果内容超过最大高度，启用滚动
  if (scrollHeight > maxHeight) {
    textarea.style.overflowY = 'scroll';
  } else {
    textarea.style.overflowY = 'hidden';
  }
};

// 监听所有textarea的input事件
const setupTextareaAutoResize = () => {
  nextTick(() => {
    textareas.value.forEach((textarea, index) => {
      if (textarea) {
        // 初始调整高度
        adjustTextareaHeight(textarea);
        
        // 监听输入事件
        const handleInput = () => adjustTextareaHeight(textarea);
        textarea.removeEventListener('input', handleInput); // 避免重复绑定
        textarea.addEventListener('input', handleInput);
        
        // 监听内容变化（比如通过代码设置的值）
        const observer = new MutationObserver(() => {
          adjustTextareaHeight(textarea);
        });
        observer.observe(textarea, { 
          attributes: true, 
          attributeFilter: ['value'],
          childList: true,
          subtree: true
        });
      }
    });
  });
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

// 下载3D模型文件
const downloadModel = (modelUrl) => {
  if (!modelUrl) return;
  
  const link = document.createElement('a');
  link.href = modelUrl;
  
  // 从URL中提取文件扩展名
  const extension = modelUrl.includes('.glb') ? '.glb' : 
                   modelUrl.includes('.obj') ? '.obj' : 
                   modelUrl.includes('.fbx') ? '.fbx' : '.glb';
  
  link.download = `3D模型${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 下载缩略图
const downloadThumbnail = (thumbnailUrl) => {
  if (!thumbnailUrl) return;
  
  const link = document.createElement('a');
  link.href = thumbnailUrl;
  
  // 从URL中提取文件扩展名
  const extension = thumbnailUrl.includes('.webp') ? '.webp' : 
                   thumbnailUrl.includes('.png') ? '.png' : 
                   thumbnailUrl.includes('.jpg') ? '.jpg' : '.webp';
  
  link.download = `3D模型预览图${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 缩略图加载错误处理
const onThumbnailError = (event) => {
  console.warn('缩略图加载失败:', event.target.src);
  // 可以设置一个默认图片或者隐藏图片
  event.target.style.display = 'none';
};


// 下载节点结果
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
  } else if (isCompleted3DTask(result)) {
    // 完成的3D任务：下载模型文件
    try {
      const taskData = JSON.parse(result);
      if (taskData.modelUrl) {
        downloadModel(taskData.modelUrl);
      } else {
        alert('没有找到可下载的3D模型文件');
      }
    } catch (e) {
      console.error('解析3D任务结果失败:', e);
      alert('解析任务结果失败');
    }
  } else if (isAsyncTask(result)) {
    // 下载异步任务信息
    const blob = new Blob([result], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `节点${index + 1}_任务信息.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    const blob = new Blob([result], { type: 'text/plain; charset=utf-8' });
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

// 调用后端API
const callAgentApi = async (nodeIndex) => {
  const node = nodes.value[nodeIndex];
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('请先登录');
  }
  
  if (!node.prompt.trim() && !node.imageData) {
    throw new Error('请输入 Prompt 内容或上传图片！');
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
    const resultToShow = normalizeApiResult(data);
    node.result = resultToShow;
    
    node.completed = true;

  } catch (error) {
    node.result = `错误: ${error.message}`;
    throw error;
  } finally {
    node.loading = false;
  }
};

// 查询异步任务状态
const checkTaskStatus = async (nodeIndex) => {
  const node = nodes.value[nodeIndex];
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('请先登录');
    return;
  }
  
  if (!isAsyncTask(node.result)) {
    alert('这不是一个异步任务');
    return;
  }
  
  try {
    // 从结果中提取任务ID - 支持多种格式
    let taskId = null;
    
    // 尝试从JSON格式提取
    try {
      const parsed = JSON.parse(node.result);
      if (parsed.task_id) {
        taskId = parsed.task_id;
      }
    } catch (e) {
      // 如果不是JSON，尝试从文本中提取
      const taskIdMatch = node.result.match(/任务ID:\s*([a-f0-9-]+)/i) || 
                          node.result.match(/task_id[:"'\s]*([a-f0-9-]+)/i);
      if (taskIdMatch) {
        taskId = taskIdMatch[1];
      }
    }
    
    if (!taskId) {
      alert('无法找到任务ID');
      console.log('node.result内容:', node.result);
      return;
    }
    
    console.log('查询任务状态，任务ID:', taskId);
    
    node.checkingStatus = true;
    
    const response = await fetch(`/api/agents/task/${taskId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || '查询状态失败');
    }
    
    const statusData = await response.json();
    console.log('任务状态查询结果:', statusData);
    
    // 更新节点结果显示
    if (statusData.success) {
      let statusMessage = `🔄 任务状态更新\n\n📋 任务ID: ${statusData.taskId}\n📡 状态: ${statusData.status}\n💬 消息: ${statusData.message}`;
      
      if (statusData.progress > 0) {
        statusMessage += `\n📊 进度: ${statusData.progress}%`;
      }
      

      
      if (statusData.status === 'success' && statusData.result) {
        statusMessage += `\n\n✅ 任务已完成！`;
        
        // 解析Tripo3D API的结果格式
        let modelUrl = null;
        let thumbnailUrl = null;
        
        if (statusData.result) {
          // 提取3D模型URL
          if (statusData.result.pbr_model && statusData.result.pbr_model.url) {
            modelUrl = statusData.result.pbr_model.url;
          } else if (statusData.result.model && statusData.result.model.urls) {
            modelUrl = statusData.result.model.urls.glb || statusData.result.model.urls.obj;
          } else if (statusData.result.urls) {
            modelUrl = statusData.result.urls.glb || statusData.result.urls.obj;
          } else if (statusData.result.glb_url) {
            modelUrl = statusData.result.glb_url;
          } else if (statusData.result.obj_url) {
            modelUrl = statusData.result.obj_url;
          } else if (typeof statusData.result === 'string' && statusData.result.startsWith('http')) {
            modelUrl = statusData.result;
          }
          
          // 提取缩略图URL
          if (statusData.result.rendered_image && statusData.result.rendered_image.url) {
            thumbnailUrl = statusData.result.rendered_image.url;
          } else if (statusData.result.thumbnail) {
            thumbnailUrl = statusData.result.thumbnail;
          }
        }
        
        if (modelUrl || thumbnailUrl) {
          // 创建一个包含所有信息的特殊结果格式，用于漂亮的UI显示
          const resultData = {
            type: 'completed_3d_task',
            modelUrl: modelUrl,
            thumbnailUrl: thumbnailUrl,
            taskId: statusData.taskId,
            message: '3D模型生成完成'
          };
          
          // 直接设置为JSON格式，触发特殊UI显示
          node.result = JSON.stringify(resultData);
          return; // 重要：直接返回，不执行后面的statusMessage覆盖逻辑
        } else {
          statusMessage += `\n📄 结果数据: ${JSON.stringify(statusData.result)}`;
        }
      } else if (statusData.status === 'failed' || statusData.status === 'error') {
        statusMessage += `\n\n❌ 任务失败`;
        if (statusData.error) {
          statusMessage += `\n🔥 错误: ${statusData.error}`;
        }
      }
      
      // 如果任务仍在进行中，保持异步任务格式
      if (statusData.status === 'queued' || statusData.status === 'running' || statusData.status === 'processing') {
        node.result = statusMessage;
      } else {
        // 任务完成或失败，更新result（但成功的3D任务已经在上面处理并返回了）
        node.result = statusMessage;
      }
      
    } else {
      alert(`查询失败: ${statusData.message}`);
    }
    
  } catch (error) {
    console.error('查询任务状态失败:', error);
    alert(`查询失败: ${error.message}`);
  } finally {
    node.checkingStatus = false;
  }
};


// 仅运行当前聚焦的节点
const runCurrentNode = () => {
  const currentIndex = focusedNodeIndex.value;
  if (nodes.value[currentIndex]) {
    callAgentApi(currentIndex);
  }
};

// 节点模态类型判断 - 文旅IP多模态创作工作流
const getNodeModalityType = (nodeId) => {
  // 根据节点ID判断其输入/输出模态类型
  const modalityMap = {
    'step1_narrative_background': { input: 'multimodal', output: 'text' },        // 多模态输入，文本输出
    'step2_visual_prototype': { input: 'text', output: 'image' },      // 文本输入，图像输出
    'step3_creative_product': { input: 'image', output: 'model' },       // 图像输入，3D模型输出
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
      
    case 'model':
      // 如果下一个节点需要3D模型输入
      if (fromNode.result.includes('.glb') || fromNode.result.includes('.obj') || fromNode.result.includes('model')) {
        toNode.modelData = fromNode.result;
        toNode.prompt = '请基于上一步生成的3D模型进行处理。';
      } else {
        console.log('前一个节点输出不是3D模型，无法传递给需要模型输入的节点');
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

// 在数据传递后调用高度调整
const transferDataAndAdjustHeight = (fromIndex, toIndex) => {
  const result = transferDataBetweenNodes(fromIndex, toIndex);
  if (result) {
    // 延迟调用以确保DOM已更新
    setTimeout(() => {
      setupTextareaAutoResize();
    }, 100);
  }
  return result;
};

// 运行所有节点
const runAllNodes = async () => {
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
          alert(`前一个节点未完成，自动执行停止在第${i + 1}个节点。`);
          break;
        }
        
        // 尝试传递数据
        const canTransfer = transferDataAndAdjustHeight(i - 1, i);
        if (!canTransfer) {
          console.log(`节点 ${i - 1} 到节点 ${i} 数据传递失败，需要用户手动输入`);
          alert(`数据传递失败，自动执行停止在第${i + 1}个节点。请手动输入内容后继续。`);
          break;
        }
        
        console.log(`数据已从节点 ${i} 传递到节点 ${i + 1}`);
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
          alert(`第${i + 1}个节点执行失败，停止自动执行。`);
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
    }
    
    // 所有节点执行完成
    if (nodes.value.every(node => node.completed)) {
      alert('🎉 所有节点执行完成！多模态创作工作流已完成。');
    }
    
  } finally {
    isRunning.value = false;
  }
};

// 退出编辑器
const exitEditor = () => {
  console.log('退出编辑器');
  // 实际项目中这里可以添加路由跳转或其他退出逻辑
};

onMounted(() => {
  focusNode(0);
  setupTextareaAutoResize(); // 在组件挂载时调用
  
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
  background-image: url('../assets/bgshizi.png');
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
  z-index: 2;
}

.focused-node {
  transform: scale(1);
  border: var(--theme-color-40) solid 3px;
  width: 600px;
  height: auto; /* 改为自动高度 */
  max-height: calc(100vh - 200px); /* 根据视口高度动态调整，留出200px给任务栏等 */
  min-height: 500px; /* 设置最小高度保证基本可用性 */
  position: relative;
  display: flex;
  flex-direction: column;
}
/* 折叠卡片样式 */
.collapsed-node {
  width: 200px !important;
  height: 300px !important;
  /* overflow: hidden; */
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

.node-actions {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-top: 15px;
  flex-shrink: 0; /* 防止按钮区域被压缩 */
  padding: 10px 0; /* 增加一些内边距 */
  border-top: 1px solid #f0f0f0; /* 添加分隔线 */
  background: white; /* 确保背景色 */
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
  min-height: auto; /* 移除固定最小高度 */
  max-height: none; /* 移除CSS最大高度限制，由JS控制 */
  height: auto; /* 自动高度 */
  resize: vertical;
  font-family: inherit;
  line-height: 1.5; /* 设置明确的行高 */
  overflow-y: hidden; /* 默认隐藏滚动，由JS控制 */
  transition: height 0.2s ease; /* 平滑的高度变化 */
}

.input-section textarea:focus {
  outline: none;
  border-color: var(--theme-color-40);
  box-shadow: 0 0 0 2px var(--theme-color-40);
}

.input-section textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 移除或注释掉原有的 .node-result pre 样式 */

.node-result {
  margin-top: 20px;
  padding-top: 20px;
  padding-bottom: 20px; /* 减少底部padding */
  border-top: 1px solid #eee;
  overflow-y: auto; /* 允许内容滚动 */
  flex: 1; /* 使用flex布局自动分配剩余空间 */
  min-height: 200px; /* 最小高度保证可见性 */
  max-height: calc(100vh - 450px); /* 根据视口高度限制最大高度 */
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


.result-async-task-container {
  width: 100%;
  min-height: 150px; /* 减少最小高度以适应小屏幕 */
  max-height: 300px; /* 限制最大高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 15px; /* 减少内边距 */
  overflow-y: auto; /* 添加滚动支持 */
}

.async-task-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px; /* 减少间距 */
  width: 100%;
  max-height: 100%; /* 确保不超出容器 */
}

.async-task-info {
  width: 100%;
  text-align: center;
  flex: 1; /* 允许信息区域伸缩 */
  overflow-y: auto; /* 如果内容过多则滚动 */
  max-height: 200px; /* 限制信息区域的最大高度 */
}

.async-task-info pre {
  background-color: #fff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
}

.async-task-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px; /* 减少上边距 */
  flex-shrink: 0; /* 防止按钮区域被压缩 */
  position: sticky; /* 粘性定位，确保按钮始终可见 */
  bottom: 0;
  background: #f8f9fa; /* 与容器背景一致 */
  padding: 5px 0; /* 增加一些内边距 */
}

.task-status-btn {
  padding: 8px 16px;
  border: 1px solid #4A90E2;
  border-radius: 4px;
  background-color: #fff;
  color: #4A90E2;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.task-status-btn:hover:not(:disabled) {
  background-color: #4A90E2;
  color: white;
}

.task-status-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-status-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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
  max-height: 400px; /* 设置固定的最大高度 */
  border: 1px solid #e9ecef; /* 添加边框以明确显示区域 */
}

/* 覆盖 v-html 内部可能生成的元素的默认样式 */
.output-content :deep(h1),
.output-content :deep(h2),
.output-content :deep(h3),
.output-content :deep(h4),
.output-content :deep(h5),
.output-content :deep(h6) {
  margin-top: 0.2em; /* 大幅减少标题顶部间距 */
  margin-bottom: 0.1em; /* 大幅减少标题底部间距 */
  font-weight: 600;
  line-height: 1.3; /* 紧凑的标题行高 */
}
.output-content :deep(p) {
  margin-bottom: 0.2em; /* 大幅减少段落间距 */
  margin-top: 0; /* 移除段落顶部间距 */
  line-height: 1.3; /* 更紧凑的行高 */
}
.output-content :deep(ul),
.output-content :deep(ol) {
  padding-left: 1.5em; /* 减少列表缩进 */
  margin-bottom: 0.1em; /* 大幅减少列表底部间距 */
  margin-top: 0; /* 移除列表顶部间距 */
}
.output-content :deep(li) {
  margin-bottom: 0.05em; /* 极小的列表项间距 */
  line-height: 1.3; /* 紧凑的列表项行高 */
  padding: 0; /* 移除列表项内边距 */
}
.output-content :deep(hr) {
  margin-top: 0.3em; /* 减少分隔符上间距 */
  margin-bottom: 0.3em; /* 减少分隔符下间距 */
  border: none;
  border-top: 1px solid #ddd;
}
.output-content :deep(blockquote) {
  margin: 0.2em 0; /* 减少引用块间距 */
  padding-left: 1em;
  border-left: 3px solid #ddd;
}
.output-content :deep(code) {
  background-color: #e0e0e0;
  padding: 1px 3px; /* 减少代码内边距 */
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}
.output-content :deep(pre) {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 0.8em; /* 减少代码块内边距 */
  border-radius: 5px;
  overflow-x: auto;
  margin-bottom: 0.2em; /* 大幅减少代码块间距 */
  margin-top: 0; /* 移除代码块顶部间距 */
  line-height: 1.3; /* 紧凑的代码行高 */
}
.output-content :deep(pre) code {
    background-color: transparent;
    padding: 0;
}
.output-content :deep(table) {
  margin: 0.2em 0; /* 减少表格间距 */
  border-collapse: collapse;
}
.output-content :deep(th),
.output-content :deep(td) {
  padding: 0.3em 0.5em; /* 减少表格单元格内边距 */
  border: 1px solid #ddd;
}
/* 减少嵌套列表的间距 */
.output-content :deep(li ul),
.output-content :deep(li ol) {
  margin-top: 0.05em;
  margin-bottom: 0.05em;
}
/* 确保第一个和最后一个元素没有额外间距 */
.output-content :deep(*:first-child) {
  margin-top: 0 !important;
}
.output-content :deep(*:last-child) {
  margin-bottom: 0 !important;
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

/* 完成的3D任务样式 */
.result-completed-3d-container {
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  margin-bottom: 15px;
}

.completed-3d-preview {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.thumbnail-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.thumbnail-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.model-info {
  text-align: center;
}

.model-info h3 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.model-info p {
  color: #5a6c7d;
  margin: 0 0 20px 0;
  font-size: 14px;
}

.model-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.download-model-btn,
.download-thumbnail-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.download-model-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.download-model-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.download-thumbnail-btn {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #8b4513;
  box-shadow: 0 4px 15px rgba(252, 182, 159, 0.4);
}

.download-thumbnail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(252, 182, 159, 0.6);
}

@media (max-width: 768px) {
  .node-card {
    width: 300px;
    min-height: 400px; /* 减少最小高度 */
  }
  
  .focused-node {
    max-height: calc(100vh - 150px); /* 小屏幕上留更少空间给任务栏 */
    min-height: 400px; /* 减少最小高度 */
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
  
  .node-result {
    max-height: calc(100vh - 350px); /* 小屏幕上调整结果区域高度 */
    min-height: 150px; /* 减少最小高度 */
  }
  
  .result-async-task-container {
    min-height: 120px; /* 进一步减少最小高度 */
    max-height: 250px; /* 减少最大高度 */
    padding: 10px; /* 减少内边距 */
  }
  
  .async-task-info {
    max-height: 150px; /* 小屏幕上减少信息区域高度 */
  }
  
  .model-actions {
    flex-direction: column;
  }
  
  .download-model-btn,
  .download-thumbnail-btn {
    width: 100%;
    justify-content: center;
  }
}

/* 专门针对高度较小的屏幕 */
@media (max-height: 800px) {
  .focused-node {
    max-height: calc(100vh - 120px); /* 更紧凑的高度分配 */
    min-height: 350px; /* 进一步减少最小高度 */
  }
  
  .node-result {
    max-height: calc(100vh - 300px); /* 更紧凑的结果区域 */
  }
  
  .result-async-task-container {
    min-height: 100px; /* 最小化异步任务容器高度 */
    max-height: 200px;
  }
  
  .async-task-info {
    max-height: 120px; /* 进一步压缩信息区域 */
  }
}

</style>