<template>
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
</style>