const axios = require('axios');
const FormData = require('form-data');
/**
 * Send a prompt to the configured LLM provider and return the response.
 * The API key and endpoint are read from environment variables.
 *
 * LLM_API_KEY   - key for authenticating with the provider
 * LLM_API_URL   - HTTP endpoint for chat completions
 */
// async function callLLM({ payload, prompt, model, apiUrl, apiKey }) {
//   const finalApiKey = apiKey || process.env.LLM_API_KEY;
//   const finalUrl = apiUrl || process.env.LLM_API_URL;

//   if (!finalApiKey) {
//     throw new Error('LLM API key not configured');
//   }

//   // If a full payload is provided use it directly, otherwise build the
//   // default chat-completion body from the prompt and model.
//   // 需要更改model！
//   const body = payload || {
//     model: model || process.env.LLM_MODEL,
//     messages: [{ role: 'user', content: prompt }]
//   };

//   const headers = {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${finalApiKey}`
//   };

//   const { data } = await axios.post(finalUrl, body, { headers });
//   return data;
// }


async function callLLM({ payload, prompt, model, apiUrl, apiKey, nodeType }) {
  const finalApiKey = apiKey || process.env.LLM_API_KEY;
  const finalUrl = apiUrl || process.env.LLM_API_URL;

  if (!finalApiKey) {
    throw new Error('LLM API key not configured');
  }

  let body;
  const headers = {
    Authorization: `Bearer ${finalApiKey}`
  };

  if (nodeType === 'text-to-image') {
    const formData = new FormData();
    formData.append('prompt', payload.prompt);
    formData.append('advanced_opt', JSON.stringify(payload.advanced_opt));
    body = formData;
    Object.assign(headers, formData.getHeaders());
  } else {
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
