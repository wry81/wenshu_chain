const axios = require('axios');
const FormData = require('form-data');

async function callLLM({ payload, prompt, model, apiUrl, apiKey, nodeType }) {
  console.log(`[llmService] Node type: ${nodeType || 'default'}`);

  const finalApiKey = apiKey || process.env.LLM_API_KEY;
  const finalUrl = apiUrl || process.env.LLM_API_URL;

  if (!finalApiKey) {
    throw new Error('LLM API key not configured');
  }

  let body;
  const headers = {
    Authorization: `Bearer ${finalApiKey}`
  };

  if (nodeType === 'text-to-image' || nodeType === 'image-to-image') {
    // 生成图像或图转图：使用 FormData
    const formData = new FormData();
    if (payload.prompt) formData.append('prompt', payload.prompt);
    if (payload.advanced_opt) formData.append('advanced_opt', JSON.stringify(payload.advanced_opt));
    if (payload.image) formData.append('image', payload.image);
    body = formData;
    Object.assign(headers, formData.getHeaders());
  } else {
    // 其他模式（文本、视频、图文问答等）：JSON 传输
    headers['Content-Type'] = 'application/json';
    body = payload || {
      model: model || process.env.LLM_MODEL,
      messages: [{ role: 'user', content: prompt }]
    };
  }
  
  try {
    console.log(`[llmService] 准备请求: ${finalUrl}`);
    console.log(`[llmService] 请求体类型: ${body instanceof FormData ? 'FormData' : 'JSON'}`);
    
    const { data } = await axios.post(finalUrl, body, { headers });

    // === 修改点：限制日志输出长度 ===
    const responseString = JSON.stringify(data, null, 2);
    // 只截取前500个字符，如果超出则在末尾添加...
    const truncatedResponse = responseString.length > 500 ? responseString.substring(0, 500) + '...' : responseString;
    console.log(`[llmService] API 请求成功，返回数据 (部分):`, truncatedResponse);
    // === 修改结束 ===
    
    return data;
    
  } catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('[llmService] API 请求彻底失败:');
    if (error.response) {
      console.error('  -> 状态码:', error.response.status);
      console.error('  -> 返回头:', JSON.stringify(error.response.headers, null, 2));
      console.error('  -> 返回数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('  -> 请求已发出，但无响应。请检查目标服务器是否可达，或是否存在网络超时。');
    } else {
      console.error('  -> 错误信息:', error.message);
    }
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    throw new Error('LLM service request failed. Please check server logs for details.');
  }
}

async function chat(prompt) {
  return callLLM({ prompt });
}

module.exports = {
  chat,
  callLLM
};
