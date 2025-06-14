<template>
  <div class="node-edit-page">
    <div class="editor-container">
      <VueFlow
        v-model="elements"
        :fit-view-on-init="true"
        :snap-to-grid="true"
        :snap-grid="[15, 15]"
        @connect="onConnect"
        @node-drag-stop="onNodeDragStop"
        @pane-ready="onPaneReady"
      >
        <template #node-stepNode="nodeProps">
          <StepNode
            :node="nodeProps.node"
            @update-data="updateNodeData"
            @redo-node="redoNode"
            @download-result="downloadResult"
            @continue-flow="addNextNode"
            @toggle-sidebar="handleToggleSidebar"
          />
        </template>

        <Controls />
      </VueFlow>
    </div>

    <div class="bottom-toolbar">
      <button class="toolbar-btn" @click="exitEditor">退出</button>
      <button class="toolbar-btn" @click="resetAllNodes">全部重做</button>
      <button class="toolbar-btn primary" @click="runWorkflow" :disabled="isGeneratingAll">
        {{ isGeneratingAll ? '运行中...' : '运行' }}
      </button>

      <div class="progress-bar-container">
        <ProgressBar
          :nodes="progressNodes"
          :current-node-id="activeNodeId"
          @jump-to-node="jumpToNode"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed, provide, inject, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, useVueFlow, Background, Controls, Position } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

// 导入自定义节点组件和进度条组件
import StepNode from './components/StepNode.vue';
import ProgressBar from './components/ProgressBar.vue';

// 定义 props，接收 agentId
const props = defineProps({
  agentId: String,
});

// Vue Flow 实例相关
const {
  setNodes,
  setEdges,
  addNodes,
  addEdges,
  onConnect,
  onNodeDragStop,
  fitView,
  getNodes,
  getEdges,
  onPaneReady, // 确保画布加载完成后再执行 fitView
} = useVueFlow();

// --- 声明响应式变量 ---
const elements = ref([]); // Vue Flow 的所有元素 (节点和连线)
const nodeIdCounter = ref(1); // 节点ID计数器
const isGeneratingAll = ref(false); // 控制“运行”按钮状态
const draggingNode = ref(null); // 用于拖拽时的节点状态，这里虽然声明了但似乎未使用，保留

// **关键修改：声明 isInitialLoad 为 ref**
const isInitialLoad = ref(true); // 默认设置为 true

// 注入 activeNodeId (这个 activeNodeId 是从 main.js 提供的全局状态)
const activeNodeId = inject('activeNodeId', ref(null)); // 确保注入，并提供默认值 ref(null)

// 计算属性，用于进度条显示
const progressNodes = computed(() => {
  // 筛选出所有 StepNode 类型的节点，并按创建顺序排序
  return getNodes.value
    .filter(node => node.type === 'stepNode')
    .sort((a, b) => {
        // 尝试解析节点ID中的数字部分进行排序
        const aNum = parseInt(a.id.split('_')[1]);
        const bNum = parseInt(b.id.split('_')[1]);
        return aNum - bNum;
    });
});

// --- 生命周期钩子 ---
const emit = defineEmits(['toggle-sidebar']); // 用于向 Main.vue 发送事件
const router = useRouter(); // 引入 Vue Router
const route = useRoute(); // 引入 Vue Router 的 useRoute 获取路由参数 (这里没有直接使用，但可能在其他地方被引用)

onMounted(() => {
  console.log('NodeEdit.vue: Component mounted.');
  emit('toggle-sidebar', false);
  initializeFirstNode(); // 首次加载时直接初始化节点
  isInitialLoad.value = false; // 首次加载完成后设置为 false
  console.log('NodeEdit.vue: After initializeFirstNode, elements.value (should contain nodes):', elements.value);
  console.log('NodeEdit.vue: After initializeFirstNode, getNodes.value (from useVueFlow):', getNodes.value);
});

onBeforeUnmount(() => {
  // 页面离开时，可以选择是否展开侧边栏
  emit('toggle-sidebar', true);
});

// --- Vue Flow 回调 ---
onConnect((params) => {
  addEdges([params]);
});

onNodeDragStop(() => {
  // 节点拖拽停止后的逻辑，比如保存布局
});

onPaneReady(() => {
  // 画布准备就绪后，调整视图以适应所有节点
  fitView();
});

// --- 核心业务逻辑 ---

// 初始化第一个节点
const initializeFirstNode = () => {
  console.log('NodeEdit.vue: Initializing the first node...');
  const initialNode = {
    id: `step_${nodeIdCounter.value++}`,
    type: 'stepNode',
    position: { x: 100, y: 100 }, // 确认这里有合理的初始位置
    data: {
      step: 1,
      title: '步骤1：选择设计主题',
      prompt: '',
      output: {
        text: '',
        images: [],
      },
      status: 'idle',
      isInitialNode: true,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };
  addNodes([initialNode]);
  activeNodeId.value = initialNode.id;
  console.log('NodeEdit.vue: First node object created and passed to addNodes:', initialNode);
};

// 更新节点数据
const updateNodeData = ({ nodeId, key, value }) => {
  setNodes((nds) =>
    nds.map((node) => {
      if (node.id === nodeId) {
        // 针对嵌套对象，进行深拷贝或更新
        if (key === 'output') {
          node.data.output = { ...node.data.output, ...value };
        } else {
          node.data = { ...node.data, [key]: value };
        }
      }
      return node;
    })
  );
};

// 触发单个节点“重做”
// const redoNode = async (nodeId) => {
//   const node = getNodes.value.find(n => n.id === nodeId);
//   if (node) {
//     // 重置节点状态
//     updateNodeData({ nodeId, key: 'output', value: { text: '', images: [] } });
//     updateNodeData({ nodeId, key: 'status', value: 'loading' });
//     await generateContentForNode(node);
//     // generateContentForNode 内部会更新状态，这里不再需要
//   }
// };
// 触发单个节点“重做”
const redoNode = async (nodeId) => {
  const node = getNodes.value.find(n => n.id === nodeId);
  if (node) {
    // 重置节点状态
    updateNodeData({ nodeId, key: 'output', value: { text: '', images: [] } });
    updateNodeData({ nodeId, key: 'status', value: 'loading' });

    // 等待DOM和响应式数据更新完成
    await nextTick(); 

    // 确保现在读取的是最新状态
    const updatedNode = getNodes.value.find(n => n.id === nodeId);
    await generateContentForNode(updatedNode);
  }
};

// 下载结果
const downloadResult = (nodeId) => {
  const node = getNodes.value.find(n => n.id === nodeId);
  if (node && node.data.output.images && node.data.output.images.length > 0) {
    // 简单示例：下载第一张图片
    const imgData = node.data.output.images[0];
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imgData}`;
    link.download = `agent_${props.agentId}_step_${node.data.step}_image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('图片已开始下载！');
  } else {
    alert('没有可下载的图片！');
  }
};

// 继续：创建下一个节点
const addNextNode = (currentNodeId) => {
  const currentNode = getNodes.value.find(n => n.id === currentNodeId);
  if (!currentNode) return;

  const nextStep = currentNode.data.step + 1;
  const newNodeId = `step_${nodeIdCounter.value++}`;
  const newNode = {
    id: newNodeId,
    type: 'stepNode',
    position: { x: currentNode.position.x + 300, y: currentNode.position.y }, // 在当前节点右侧创建
    data: {
      step: nextStep,
      title: `步骤${nextStep}：继续生成...`, // 默认标题
      prompt: '',
      output: {
        text: '',
        images: [],
      },
      status: 'idle',
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };

  const newEdge = {
    id: `e${currentNodeId}-${newNodeId}`,
    source: currentNodeId,
    target: newNodeId,
  };

  addNodes([newNode]);
  addEdges([newEdge]);
  activeNodeId.value = newNodeId; // 激活新创建的节点
  fitView(); // 适应视图以显示新节点
};

// 退出编辑器
const exitEditor = () => {
  // 导航回已购买智能体页面
  router.push('/main/insight-engine/smart-insight');
};

// 全部重做
const resetAllNodes = () => {
  if (confirm('确定要重置所有节点并回到初始状态吗？所有已生成内容将丢失！')) {
    setNodes([]); // 清空所有节点
    setEdges([]); // 清空所有连线
    nodeIdCounter.value = 1; // 重置计数器
    initializeFirstNode(); // 重新创建第一个节点
    alert('已重置所有节点。');
  }
};

// 运行整个工作流
// const runWorkflow = async () => {
//   if (isGeneratingAll.value) return;

//   isGeneratingAll.value = true;
//   const nodesToProcess = progressNodes.value; // 获取所有步骤节点

//   for (const node of nodesToProcess) {
//     activeNodeId.value = node.id; // 激活当前处理的节点
//     updateNodeData({ nodeId: node.id, key: 'status', value: 'loading' });
//     await generateContentForNode(node); // 调用生成内容的方法
//     // generateContentForNode 内部会根据结果更新状态，这里不再需要额外的判断
//     // 如果 generateContentForNode 内部抛出错误，循环也会中断
//     if (node.data.status === 'error') {
//         alert(`节点 ${node.data.title} 生成失败，流程终止！`);
//         isGeneratingAll.value = false;
//         return; // 遇到错误时停止整个流程
//     }
//   }
//   isGeneratingAll.value = false;
//   activeNodeId.value = null; // 全部完成后取消激活
//   alert('所有节点内容生成完成！');
// };
// 运行整个工作流
const runWorkflow = async () => {
  if (isGeneratingAll.value) return;

  isGeneratingAll.value = true;
  const nodesToProcess = progressNodes.value;

  for (const node of nodesToProcess) {
    activeNodeId.value = node.id;
    updateNodeData({ nodeId: node.id, key: 'status', value: 'loading' });
    
    // 等待状态更新
    await nextTick();

    const updatedNode = getNodes.value.find(n => n.id === node.id);
    await generateContentForNode(updatedNode); 

    if (updatedNode.data.status === 'error') {
        alert(`节点 ${updatedNode.data.title} 生成失败，流程终止！`);
        isGeneratingAll.value = false;
        return;
    }
  }
  isGeneratingAll.value = false;
  activeNodeId.value = null;
  alert('所有节点内容生成完成！');
};

// 核心：调用后端API生成内容
// 这个函数会被每个节点的“运行”或“重做”触发，以及“全部运行”时循环触发
// 核心：调用后端API生成内容
// 核心：调用后端API生成内容（带有调试日志的版本）
const generateContentForNode = async (node) => {
  console.log('--- [调试开始] ---');
  console.log('1. generateContentForNode 函数被调用，节点信息:', node);

  const currentPrompt = node.data.prompt;
  console.log('2. 获取到的 Prompt 内容:', currentPrompt);

  if (!currentPrompt) {
    alert('Prompt 不能为空！');
    console.log('!! [调试中止] 原因: Prompt 为空。');
    updateNodeData({ nodeId: node.id, key: 'status', value: 'error' });
    updateNodeData({ nodeId: node.id, key: 'output', value: { text: '', images: [], error: 'Prompt不能为空' } });
    return;
  }

  console.log('3. 准备从 localStorage 获取 token...');
  const token = localStorage.getItem('token');
  console.log('4. 获取到的 token:', token); // 检查这里打印出来的是否为 null 或空字符串

  if (!token) {
    alert('您尚未登录，请先登录！');
    console.log('!! [调试中止] 原因: token 为空，用户未认证。');
    updateNodeData({ nodeId: node.id, key: 'status', value: 'error' });
    updateNodeData({ nodeId: node.id, key: 'output', value: { text: '', images: [], error: '用户未认证' } });
    router.push('/login');
    return;
  }

  console.log('5. 所有检查通过，准备执行 fetch...');
  try {
    const response = await fetch(`/api/agents/${props.agentId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        input: currentPrompt
      }),
    });
    
    console.log('6. fetch 请求已发送，等待响应...');

    if (!response.ok) {
      const errorData = await response.json();
      console.error('!! [调试错误] API 响应不成功:', response.status, errorData);
      throw new Error(errorData.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('7. 成功接收到后端数据:', data);

    updateNodeData({
      nodeId: node.id,
      key: 'output',
      value: { text: data.result || '', images: [], error: null },
    });
    updateNodeData({ nodeId: node.id, key: 'status', value: 'success' });
    console.log('--- [调试结束] ---');

  } catch (error) {
    console.error('!! [调试错误] 在 try...catch 块中捕获到错误:', error);
    // 截图中的弹窗就是由下面这行代码触发的
    alert(`节点 ${node.data.title} 生成失败，流程终止！`);
    updateNodeData({
      nodeId: node.id,
      key: 'output',
      value: { text: '', images: [], error: error.message || '生成失败' },
    });
    updateNodeData({ nodeId: node.id, key: 'status', value: 'error' });
    console.log('--- [调试结束] ---');
  }
};


// 进度条跳转到对应节点
const jumpToNode = (nodeId) => {
  const targetNode = getNodes.value.find(n => n.id === nodeId);
  if (targetNode) {
    // 移动视图到该节点
    fitView({
      nodes: [targetNode],
      duration: 500, // 动画时间
      minZoom: 0.8,
      maxZoom: 1.2,
      padding: 0.5,
    });
    activeNodeId.value = nodeId; // 标记为当前激活节点
  }
};

// 监听路由参数变化，如果 agentId 变化，重新初始化节点
watch(() => props.agentId, (newAgentId, oldAgentId) => {
  // **关键修改：使用 isInitialLoad 避免首次加载时重置**
  if (!isInitialLoad.value && newAgentId && newAgentId !== oldAgentId) {
    resetAllNodes(); // 当智能体ID变化时，重置所有节点
  }
}, { immediate: true }); // 立即执行一次

// 监听侧边栏状态，并处理 Main.vue 传来的事件
const handleToggleSidebar = (state) => {
  // 实际上这里不需要做什么，因为侧边栏的开关在 Main.vue 层面控制
  // 只是让这个组件知道 Main.vue 的侧边栏被控制了
  // 如果需要根据侧边栏状态调整画布布局，可以在这里处理
};
</script>

<style scoped>
/* 类名已修改 */
.node-edit-page {
  display: flex;
  flex-direction: column;
  height: 90vh;
  /* padding: 20px; */
  /* background-color: var(--color-background); 
  border-radius: var(--border-radius-large); */
  /* box-shadow: var(--box-shadow-soft); */
}

.editor-header {
  text-align: center;
  margin-bottom: 20px;
}

.editor-title {
  font-size: var(--font-size-h2); /* H2 / 标题 / 26px */
  font-weight: 600;
  color: var(--color-title); /* 标题颜色 1F0C0C */
  margin-bottom: 10px;
}

.editor-subtitle {
  font-size: var(--font-size-body); /* 正文 / 14px */
  color: var(--color-description); /* 说明文字 AD8888 */
}

.editor-container {
  flex-grow: 1;
  border: 1px dashed var(--color-divider); /* 虚线框 E9E9E9 */
  border-radius: var(--border-radius-large);
  /* background-color: var(--color-neutral-light); 背景 F3F3F3 */
  margin-bottom: 0px; /* 与底部工具栏的间距 */
  overflow: hidden; /* 确保内容不溢出 */
}

/* Vue Flow 样式覆盖 */
:deep(.vue-flow__node) {
  border-radius: var(--border-radius-medium);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: var(--font-size-body);
  width: 300px; /* 节点宽度 */
  min-height: 250px; /* 节点最小高度 */
  padding: 0; /* 节点内部内容自己控制 padding */
  display: flex;
  flex-direction: column;
  background-color: #fff; /* 默认节点背景色 */
  border: 1px solid var(--color-divider);
}

/* 节点连接点 */
:deep(.vue-flow__handle) {
  background: var(--theme-color-primary);
  border: 1px solid #fff;
  width: 10px;
  height: 10px;
}

:deep(.vue-flow__edge) {
  stroke: var(--color-neutral-mid-gray);
  stroke-width: 2;
}

:deep(.vue-flow__edge.selected) {
  stroke: var(--theme-color-primary);
}

:deep(.vue-flow__controls) {
  top: 10px;
  right: 10px;
}

:deep(.vue-flow__pane) {
  /* 整体浅灰色背景 */
  background-color: #F6F5F5 !important; /* 你可以根据需要调整浅灰色 */

  /* 修改为独立的十字图案背景 */
  background-image: url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 15h8M15 11v8' stroke='%23E5E5E5' stroke-width='1' /%3E%3C/svg%3E") !important;
  background-size: 50px 50px !important; /* 确保背景大小与 SVG 的 width/height 匹配 */
  background-repeat: repeat !important; /* 确保图案重复 */
}

/* :deep(.vue-flow__background path) {
    fill: #666 !important;
} */

.bottom-toolbar {
  height: 80px; /* 工具栏高度 */
  background-color: #fff;
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-soft);
  display: flex;
  align-items: center;
  padding: 0 30px;
  gap: 20px;
  flex-shrink: 0; /* 防止被压缩 */
  margin-top: 20px;
}

.toolbar-btn {
  padding: 10px 20px;
  border: 1px solid var(--color-divider);
  border-radius: var(--border-radius-medium);
  background-color: transparent;
  color: var(--color-text-body);
  cursor: pointer;
  font-size: var(--font-size-body);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.toolbar-btn:hover {
  background-color: var(--theme-color-40);
}

.toolbar-btn.primary {
  background-color: var(--theme-color-primary);
  color: #fff;
  border-color: var(--theme-color-primary);
}

.toolbar-btn.primary:hover {
  background-color: var(--theme-color-60);
}

.toolbar-btn:disabled {
  background-color: var(--color-neutral-mid-gray);
  color: #fff;
  cursor: not-allowed;
  border-color: var(--color-neutral-mid-gray);
}

.progress-bar-container {
  flex-grow: 1; /* 占据剩余空间 */
  margin-left: 50px;
  display: flex; /* 让进度条内部元素居中 */
  align-items: center;
}
</style>