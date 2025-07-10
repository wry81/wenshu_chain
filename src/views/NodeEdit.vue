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
              <div
                v-else-if="node.result"
                class="output-content"
                v-html="marked(node.result)"
              />
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
              
              <!-- 如果是最后一个节点（文档生成），显示PDF导出按钮 -->
              <template v-if="node.nodeId === 'step5_doc_generation'">
                <button 
                  class="preview-btn" 
                  :disabled="!node.result || node.loading"
                  title="预览HTML格式"
                  @click.stop="previewHTML(node.result)"
                >
                  <span>👁️ 预览</span>
                </button>
                <button 
                  class="export-pdf-btn" 
                  :disabled="!node.result || node.loading"
                  title="导出为精美的PDF报告"
                  @click.stop="exportToPDF(node.result, '洞察引擎分析报告')"
                >
                  <span>📄 导出PDF</span>
                </button>
                <button 
                  class="download-btn" 
                  :disabled="!node.result || node.loading"
                  title="导出为文本文件"
                  @click.stop="downloadResult(index)"
                >
                  <span>📝 导出文本</span>
                </button>
              </template>
              
              <!-- 其他节点的常规下载按钮 -->
              <template v-else>
                <button 
                  class="download-btn" 
                  :disabled="!node.result || node.loading"
                  @click.stop="downloadResult(index)"
                >
                  <span>下载结果</span>
                </button>
              </template>
              
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
        <span v-else>运行</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js'; 

const route = useRoute();
const agentId = ref(route.params.agentId || 'default-agent');
const textareas = ref([]);
const nodeCards = ref([]);
const scrollContainer = ref(null);
let scrollTimeout = null;

const nodes = ref([
  {
    nodeId: 'step1_analyze_market',
    title: '分析市场数据',
    prompt: '',
    placeholder: '请根据以下市场信息，分析其主要趋势、机遇和挑战：',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step2_social_analysis',
    title: '社媒热点分析',
    prompt: '',
    placeholder: '社交媒体热点词汇抓取与分析...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step3_competitor_research',
    title: '竞品调研',
    prompt: '',
    placeholder: '请输入竞品...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step4_challenge_opportunity',
    title: '现状挑战与机遇',
    prompt: '',
    placeholder: '请输入内容...',
    result: '',
    completed: false,
    loading: false
  },
  {
    nodeId: 'step5_doc_generation',
    title: '文档生成',
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

// 下载节点结果
const downloadResult = (index) => {
  const result = nodes.value[index].result;
  if (!result) return;
  
  const node = nodes.value[index];
  
  // 如果是最后一个节点（文档生成），提供PDF导出选项
  if (node.nodeId === 'step5_doc_generation') {
    const userChoice = confirm('是否导出为PDF格式？\n点击"确定"导出PDF，点击"取消"导出文本文件。');
    if (userChoice) {
      exportToPDF(result, '洞察引擎分析报告');
      return;
    }
  }
  
  // 默认导出为文本文件
  const blob = new Blob([result], { type: 'text/plain; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${node.title}_${new Date().toLocaleDateString('zh-CN')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 导出PDF功能
const exportToPDF = async (markdownContent, filename = '洞察引擎报告') => {
  // 在函数开始就声明tempDiv变量
  let tempDiv = null;
  
  try {
    console.log('[PDF Export] 开始导出，内容长度:', markdownContent.length);
    
    // 检查内容是否为空
    if (!markdownContent || markdownContent.trim().length === 0) {
      alert('没有可导出的内容！请先生成报告内容。');
      return;
    }
    
    // 检查html2pdf库是否可用
    if (!html2pdf) {
      throw new Error('PDF导出库未正确加载，请刷新页面重试');
    }
    console.log('[PDF Export] html2pdf库已就绪');
    
    // 将Markdown转换为HTML
    const htmlContent = marked(markdownContent);
    console.log('[PDF Export] HTML转换完成，HTML长度:', htmlContent.length);
    
    // 创建一个临时的div元素来渲染HTML
    tempDiv = document.createElement('div');
    
    // 先设置基本样式
    tempDiv.style.cssText = `
      font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
      box-sizing: border-box;
    `;
    
    // 然后设置HTML内容
    tempDiv.innerHTML = htmlContent;
    
    // 验证内容是否正确设置
    if (!tempDiv.innerHTML || tempDiv.innerHTML.trim().length === 0) {
      throw new Error('HTML内容转换失败，无法生成PDF');
    }
    
    // 添加自定义样式
    const style = document.createElement('style');
    style.textContent = `
      h1, h2, h3, h4, h5, h6 {
        color: #2c3e50;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }
      h1 {
        font-size: 2.2em;
        border-bottom: 3px solid #3498db;
        padding-bottom: 0.3em;
      }
      h2 {
        font-size: 1.8em;
        border-bottom: 2px solid #e74c3c;
        padding-bottom: 0.2em;
      }
      h3 {
        font-size: 1.4em;
        color: #e67e22;
      }
      p {
        margin-bottom: 1em;
        text-align: justify;
      }
      ul, ol {
        margin-bottom: 1em;
        padding-left: 2em;
      }
      li {
        margin-bottom: 0.5em;
      }
      strong {
        color: #2c3e50;
        font-weight: 600;
      }
      em {
        color: #7f8c8d;
      }
      blockquote {
        border-left: 4px solid #3498db;
        margin: 1em 0;
        padding-left: 1em;
        color: #7f8c8d;
        font-style: italic;
      }
      code {
        background-color: #f8f9fa;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.9em;
      }
      pre {
        background-color: #2c3e50;
        color: #ecf0f1;
        padding: 1em;
        border-radius: 5px;
        overflow-x: auto;
        margin: 1em 0;
      }
      pre code {
        background: none;
        color: inherit;
        padding: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 0.8em;
        text-align: left;
      }
      th {
        background-color: #f8f9fa;
        font-weight: 600;
      }
      hr {
        border: none;
        height: 2px;
        background: linear-gradient(to right, #3498db, #e74c3c);
        margin: 2em 0;
      }
    `;
    tempDiv.appendChild(style);
    
    // 将临时div添加到body中（可见，用于调试）
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm'; // A4宽度
    tempDiv.style.height = 'auto';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.zIndex = '9999';
    tempDiv.style.overflow = 'auto';
    tempDiv.style.border = '2px solid red'; // 调试边框
    document.body.appendChild(tempDiv);
    
    console.log('[PDF Export] 临时元素已添加到DOM，内容预览:', tempDiv.textContent.substring(0, 200));
    console.log('[PDF Export] 临时元素HTML长度:', tempDiv.innerHTML.length);
    console.log('[PDF Export] 临时元素offsetHeight:', tempDiv.offsetHeight);
    console.log('[PDF Export] 临时元素offsetWidth:', tempDiv.offsetWidth);
    
    // 等待DOM更新和样式应用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // PDF导出选项 - 简化配置
    const opt = {
      margin: 1,
      filename: `${filename}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 1,
        useCORS: true,
        logging: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' 
      }
    };
    
    console.log('[PDF Export] 开始生成PDF，配置:', opt);
    console.log('[PDF Export] 目标元素:', tempDiv);
    
    try {
      // 方法1：使用真实内容但简化配置
      console.log('[PDF Export] 尝试方法1：使用真实内容');
      
      const simpleOpt = {
        margin: 10,
        filename: `${filename}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.9 },
        html2canvas: { 
          scale: 1,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      await html2pdf().set(simpleOpt).from(tempDiv).save();
      console.log('[PDF Export] 方法1成功');
      
    } catch (method1Error) {
      console.warn('[PDF Export] 方法1失败，尝试方法2:', method1Error);
      
      try {
        // 方法2：更简化的配置
        console.log('[PDF Export] 尝试方法2：更简化配置');
        const simpleOpt2 = {
          margin: 10,
          filename: `${filename}_simple.pdf`,
          html2canvas: { scale: 1 },
          jsPDF: { format: 'a4' }
        };
        
        await html2pdf().set(simpleOpt2).from(tempDiv).save();
        console.log('[PDF Export] 方法2成功');
        
      } catch (method2Error) {
        console.warn('[PDF Export] 方法2失败，尝试方法3:', method2Error);
        
        try {
          // 方法3：使用纯文本内容
          console.log('[PDF Export] 尝试方法3：纯文本内容');
          const plainDiv = document.createElement('div');
          // 更好的文本处理，保留基本格式
          const plainContent = markdownContent
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
          
          plainDiv.innerHTML = plainContent;
          plainDiv.style.width = '190mm';
          plainDiv.style.padding = '10mm';
          plainDiv.style.fontFamily = 'Arial, sans-serif';
          plainDiv.style.fontSize = '12px';
          plainDiv.style.lineHeight = '1.5';
          plainDiv.style.background = 'white';
          document.body.appendChild(plainDiv);
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await html2pdf().set({
            margin: 10,
            filename: `${filename}_plain.pdf`,
            html2canvas: { scale: 1 },
            jsPDF: { format: 'a4' }
          }).from(plainDiv).save();
          
          document.body.removeChild(plainDiv);
          console.log('[PDF Export] 方法3成功');
          
        } catch (method3Error) {
          console.error('[PDF Export] 所有方法都失败:', method3Error);
          throw new Error('PDF导出失败：所有方法都无法工作');
        }
      }
    }
    
    console.log('[PDF Export] PDF导出成功');
    
  } catch (error) {
    console.error('[PDF Export] PDF导出失败:', error);
    console.error('[PDF Export] 错误类型:', error.constructor.name);
    console.error('[PDF Export] 错误堆栈:', error.stack);
    
    // 提供更详细的错误信息
    let errorMessage = 'PDF导出失败';
    if (error.message.includes('html2pdf')) {
      errorMessage += '：PDF生成库加载失败，请刷新页面重试';
    } else if (error.message.includes('HTML内容转换失败')) {
      errorMessage += '：内容格式转换失败，请检查报告内容';
    } else if (error.message.includes('Cannot read properties')) {
      errorMessage += '：DOM元素访问失败，请重试';
    } else if (error.message.includes('jsPDF')) {
      errorMessage += '：PDF生成引擎错误，请重试';
    } else if (error.message.includes('html2canvas')) {
      errorMessage += '：页面渲染失败，请重试';
    } else {
      errorMessage += `：${error.message}`;
    }
    
    // 显示详细错误信息供调试
    console.log('[PDF Export] 详细错误信息:', {
      message: error.message,
      stack: error.stack,
      tempDivExists: !!tempDiv,
      tempDivInDOM: tempDiv && tempDiv.parentNode ? true : false,
      markdownContentLength: markdownContent.length,
      html2pdfAvailable: typeof html2pdf !== 'undefined'
    });
    
    const shouldFallback = confirm(`${errorMessage}\n\n是否改为下载Markdown文件？\n点击"确定"下载Markdown，点击"取消"取消操作。`);
    
    if (shouldFallback) {
      // 降级处理：导出为Markdown文件
      const blob = new Blob([markdownContent], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[PDF Export] 已降级为Markdown文件下载');
    }
  } finally {
    // 确保清理临时元素
    if (tempDiv && tempDiv.parentNode) {
      tempDiv.parentNode.removeChild(tempDiv);
      console.log('[PDF Export] 临时元素已清理');
    }
  }
};

// HTML预览功能
const previewHTML = (markdownContent) => {
  if (!markdownContent || markdownContent.trim().length === 0) {
    alert('没有可预览的内容！');
    return;
  }
  
  try {
    console.log('[HTML Preview] 原始Markdown内容长度:', markdownContent.length);
    console.log('[HTML Preview] 原始Markdown内容预览:', markdownContent.substring(0, 200));
    
    // 检查marked库是否可用
    if (typeof marked !== 'function') {
      throw new Error('Markdown解析库未正确加载');
    }
    
    // 配置marked选项
    marked.setOptions({
      breaks: true,
      gfm: true,
      sanitize: false,
      smartLists: true,
      smartypants: false
    });
    
    const htmlContent = marked(markdownContent);
    console.log('[HTML Preview] 转换的HTML内容长度:', htmlContent.length);
    console.log('[HTML Preview] 转换的HTML内容预览:', htmlContent.substring(0, 500));
    
    // 验证HTML内容是否为空
    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('Markdown转换后的HTML内容为空');
    }
    
    // 创建预览窗口
    const previewWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    
    if (!previewWindow) {
      alert('无法打开预览窗口，请检查浏览器是否阻止了弹窗。');
      return;
    }
    
    // 构建完整的HTML文档
    const fullHtmlDoc = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>洞察引擎报告预览</title>
  <style>
    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
      background: #f9f9f9;
    }
    .content {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }
    h1 {
      font-size: 2.2em;
      border-bottom: 3px solid #3498db;
      padding-bottom: 0.3em;
      margin-top: 0;
    }
    h2 {
      font-size: 1.8em;
      border-bottom: 2px solid #e74c3c;
      padding-bottom: 0.2em;
    }
    h3 {
      font-size: 1.4em;
      color: #e67e22;
    }
    p {
      margin-bottom: 1em;
      text-align: justify;
    }
    ul, ol {
      margin-bottom: 1em;
      padding-left: 2em;
    }
    li {
      margin-bottom: 0.5em;
    }
    strong {
      color: #2c3e50;
      font-weight: 600;
    }
    em {
      color: #7f8c8d;
    }
    blockquote {
      border-left: 4px solid #3498db;
      margin: 1em 0;
      padding-left: 1em;
      color: #7f8c8d;
      font-style: italic;
      background: #f8f9fa;
      padding: 1em;
    }
    code {
      background-color: #f8f9fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9em;
      color: #e74c3c;
    }
    pre {
      background-color: #2c3e50;
      color: #ecf0f1;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1em 0;
    }
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.8em;
      text-align: left;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(to right, #3498db, #e74c3c);
      margin: 2em 0;
    }
    .debug-info {
      background: #fffbe6;
      border: 1px solid #fadb14;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #595959;
    }
  </style>
</head>
<body>
  <div class="debug-info">
    <strong>调试信息：</strong>
    原始内容长度: ${markdownContent.length} 字符 | 
    HTML内容长度: ${htmlContent.length} 字符 | 
    生成时间: ${new Date().toLocaleString('zh-CN')}
  </div>
  <div class="content">
    ${htmlContent}
  </div>
</body>
</html>`;
    
    console.log('[HTML Preview] 完整HTML文档构建完成');
    
    // 写入HTML内容
    previewWindow.document.write(fullHtmlDoc);
    previewWindow.document.close();
    previewWindow.focus();
    
    console.log('[HTML Preview] 预览窗口已打开');
    
  } catch (error) {
    console.error('[HTML Preview] 预览失败:', error);
    console.error('[HTML Preview] 错误详细信息:', {
      message: error.message,
      stack: error.stack,
      markedAvailable: typeof marked !== 'undefined',
      contentLength: markdownContent ? markdownContent.length : 0
    });
    alert('预览失败：' + error.message + '\n\n请检查浏览器控制台获取更多详细信息。');
  }
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

// 仅运行当前聚焦的节点
const runCurrentNode = () => {
  const currentIndex = focusedNodeIndex.value;
  if (nodes.value[currentIndex]) {
    callAgentApi(currentIndex);
  }
};

// 节点模态类型判断 - 文本分析工作流
const getNodeModalityType = (nodeId) => {
  // 根据节点ID判断其输入/输出模态类型
  const modalityMap = {
    'step1_analyze_market': { input: 'text', output: 'text' },      // 文本输入，文本输出
    'step2_social_analysis': { input: 'text', output: 'text' },    // 文本输入，文本输出
    'step3_competitor_research': { input: 'text', output: 'text' }, // 文本输入，文本输出
    'step4_challenge_opportunity': { input: 'text', output: 'text' }, // 文本输入，文本输出
    'step5_doc_generation': { input: 'text', output: 'text' }      // 文本输入，文本输出
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
  
  // 对于文本分析工作流，大部分都是文本到文本的传递
  if (toModality.input === 'text') {
    // 特殊处理最后一个节点（文档生成）：整合所有前面的结果
    if (toNode.nodeId === 'step5_doc_generation') {
      const allResults = generateComprehensiveReport();
      toNode.prompt = allResults;
    } else {
      // 根据具体节点类型添加上下文提示
      const nodePrompts = {
        'step2_social_analysis': `基于以下市场分析结果，请进行社交媒体热点分析：\n\n${fromNode.result}`,
        'step3_competitor_research': `基于以下分析结果，请进行竞品调研：\n\n${fromNode.result}`,
        'step4_challenge_opportunity': `基于以下分析结果，请总结现状挑战与机遇：\n\n${fromNode.result}`
      };
      
      toNode.prompt = nodePrompts[toNode.nodeId] || fromNode.result;
    }
  } else {
    toNode.prompt = fromNode.result;
  }
  
  return true;
};

// 生成综合报告：整合所有前面节点的结果
const generateComprehensiveReport = () => {
  const reportSections = [];
  const currentDate = new Date().toLocaleDateString('zh-CN');
  
  // 报告标题
  reportSections.push(`# 洞察引擎分析报告\n\n**生成日期**: ${currentDate}\n\n---\n`);
  
  // 整合各个节点的结果
  nodes.value.forEach((node, index) => {
    if (node.completed && node.result && node.nodeId !== 'step5_doc_generation') {
      let sectionTitle = '';
      let sectionContent = node.result;
      
      switch (node.nodeId) {
        case 'step1_analyze_market':
          sectionTitle = '## 1. 市场数据分析';
          break;
        case 'step2_social_analysis':
          sectionTitle = '## 2. 社交媒体热点分析';
          break;
        case 'step3_competitor_research':
          sectionTitle = '## 3. 竞品调研分析';
          break;
        case 'step4_challenge_opportunity':
          sectionTitle = '## 4. 现状挑战与机遇';
          break;
        default:
          sectionTitle = `## ${index + 1}. ${node.title}`;
      }
      
      reportSections.push(`${sectionTitle}\n\n${sectionContent}\n\n---\n`);
    }
  });
  
  // 添加综合总结提示
  reportSections.push(`\n## 5. 综合总结与建议\n\n基于以上分析，请生成一份包含以下内容的综合报告：\n\n1. **执行摘要** - 核心发现的简明总结\n2. **关键洞察** - 从各个维度分析得出的主要洞察\n3. **战略建议** - 基于分析结果的可执行建议\n4. **风险评估** - 潜在风险和应对策略\n5. **后续行动计划** - 具体的实施步骤和时间安排\n\n请确保报告结构清晰，内容具有可操作性，并使用适当的Markdown格式进行排版。`);
  
  return reportSections.join('\n');
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
      if (!node.prompt.trim()) {
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
      alert('🎉 所有节点执行完成！工作流已完成。');
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

  // 监听所有textarea的input事件
  setupTextareaAutoResize();
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
  margin-bottom: 10px;
  transition: transform 1s ease, box-shadow 1s ease;
  scroll-snap-align: center;
  position: relative;
  overflow: visible;
  z-index: 2;
}

.focused-node {
  transform: scale(1);
  border: var(--theme-color-40) solid 3px;
  width: 600px;
  height: 700px; /* 固定高度 */
  max-height: 700px; /* 确保不超过600px */
  position: relative;
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
  padding-bottom: 60px; /* 减少底部padding */
  border-top: 1px solid #eee;
  overflow-y: auto; /* 允许内容滚动 */
  max-height: calc(100% - 350px); /* 调整最大高度，给输入区域留更多空间 */
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

/* PDF导出按钮样式 */
.export-pdf-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

/* 预览按钮样式 */
.preview-btn {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
  position: relative;
  overflow: hidden;
}

.preview-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

.preview-btn:active {
  transform: translateY(0);
}

.preview-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.export-pdf-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.export-pdf-btn:active {
  transform: translateY(0);
}

.export-pdf-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* 为文档生成节点的按钮区域优化布局 */
.node-actions {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-top: 15px;
  flex-wrap: wrap;
}

/* 在文档生成节点中，按钮可能较多，优化布局 */
.node-actions button {
  flex: 1;
  min-width: 100px;
  max-width: 140px;
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
  
  /* 小屏幕上的按钮布局优化 */
  .node-actions {
    gap: 6px;
  }
  
  .node-actions button {
    font-size: 12px;
    padding: 8px 12px;
    min-width: 80px;
  }
}

</style>