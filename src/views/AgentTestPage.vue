<!-- <template>
  <div class="agent-test-page">
    <h2>Agent API Test</h2>
    <div class="input-section">
      <textarea v-model="prompt" placeholder="输入 Prompt" rows="4" cols="40" />
    </div>
    <button @click="runAgent">发送</button>
    <div class="output-section">
      <h3>输出</h3>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const prompt = ref('');
const result = ref('');
const agentId = ref(route.params.agentId || '1');

const runAgent = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('请先登录');
    return;
  }
  try {
    const response = await fetch(`/api/agents/${agentId.value}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ input: prompt.value }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || '请求失败');
    }
    const data = await response.json();
    result.value = data.result || JSON.stringify(data);
  } catch (err) {
    result.value = `错误: ${err.message}`;
  }
};
</script>

<style scoped>
.agent-test-page {
  padding: 20px;
}
.input-section textarea {
  width: 100%;
  margin-bottom: 10px;
}
.output-section pre {
  background: #f7f7f7;
  padding: 10px;
}
</style> -->

<template>
  <div class="agent-test-page">
    <h2>Agent API Test</h2>
    <div class="input-section">
      <textarea v-model="prompt" placeholder="输入 Prompt" rows="4" cols="40" />
    </div>
    <button @click="runAgent">发送</button>
    <div class="output-section">
      <h3>输出</h3>
      <div class="output-content" v-html="renderedResult"></div>
    </div>
  </div>
</template>

<script setup>
// 修改点：引入 computed 和 marked
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked'; // 引入 marked 库

const route = useRoute();
const prompt = ref('');
const result = ref('');
const agentId = ref(route.params.agentId || '1');

// 修改点：添加一个计算属性来处理 Markdown 渲染
const renderedResult = computed(() => {
  if (result.value && typeof result.value === 'string') {
    // 对错误信息做特殊处理，避免被解析
    if (result.value.startsWith('错误:')) {
      return `<p style="color: red;">${result.value}</p>`;
    }
    // 使用 marked 将结果从 Markdown 转换为 HTML
    return marked(result.value);
  }
  return '';
});

const runAgent = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('请先登录');
    return;
  }

  // 开始请求时，可以先清空旧结果
  result.value = '正在生成...';

  try {
    const response = await fetch(`/api/agents/${agentId.value}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ input: prompt.value }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || '请求失败');
    }
    const data = await response.json();
    // 将后端返回的文本结果赋值给 result
    result.value = data.result || JSON.stringify(data, null, 2);
  } catch (err) {
    result.value = `错误: ${err.message}`;
  }
};
</script>

<style scoped>
.agent-test-page {
  padding: 20px;
}
.input-section textarea {
  width: 100%;
  margin-bottom: 10px;
}
.output-section {
  margin-top: 15px;
}
.output-section h3 {
  margin-bottom: 10px;
}
/* 修改点：为渲染后的内容添加样式 */
.output-content {
  background: #f7f7f7;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  min-height: 100px;
  /* 确保 Markdown 样式被正确应用 */
  line-height: 1.6;
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
</style>