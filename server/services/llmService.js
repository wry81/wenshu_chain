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

  if (nodeType === 'image-to-model') {
    // 3D模型生成：使用特殊的API key和JSON格式
    const tripoApiKey = process.env.TRIPO_API_KEY;
    if (!tripoApiKey) {
      throw new Error('TRIPO API key not configured');
    }
    
    headers.Authorization = `Bearer ${tripoApiKey}`;
    headers['Content-Type'] = 'application/json';
    
    // 处理图片数据：如果是base64格式，需要转换为file_token
    if (payload.file && payload.file.file_token) {
      if (typeof payload.file.file_token === 'string' && payload.file.file_token.startsWith('data:image/')) {
        // 这里需要先上传图片获取file_token，暂时直接使用base64
        // 实际应用中可能需要先调用上传API获取token
        console.log('[llmService] 处理image-to-model的base64图片数据');
      }
    }
    
    body = payload;
  } else if (nodeType === 'text-to-image' || nodeType === 'image-to-image') {
    // 生成图像或图转图：使用 FormData
    const formData = new FormData();
    if (payload.prompt) formData.append('prompt', payload.prompt);
    if (payload.advanced_opt) formData.append('advanced_opt', JSON.stringify(payload.advanced_opt));
    if (payload.image) formData.append('image', payload.image);
    body = formData;
    Object.assign(headers, formData.getHeaders());
  } else if (payload._isMultipart) {
    // unicomiqa40B模型：使用 multipart/form-data 格式
    const formData = new FormData();
    
    // 添加所有非特殊字段到FormData
    Object.keys(payload).forEach(key => {
      if (key !== '_isMultipart') {
        const value = payload[key];
        if (value !== undefined && value !== null) {
          // 特殊处理img字段：将base64转换为文件
          if (key === 'img' && typeof value === 'string' && value.startsWith('data:image/')) {
            try {
              // 解析base64数据
              const matches = value.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
              if (matches && matches[2]) {
                const imageType = matches[1]; // jpeg, png等
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');
                
                // 作为文件添加到FormData
                formData.append('img', buffer, {
                  filename: `image.${imageType}`,
                  contentType: `image/${imageType}`
                });
              } else {
                console.warn('[llmService] 无效的base64图片格式');
              }
            } catch (error) {
              console.error('[llmService] base64图片处理失败:', error);
            }
          } else {
            // 其他字段正常处理
            if (typeof value === 'object' && !Buffer.isBuffer(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          }
        }
      }
    });
    
    body = formData;
    Object.assign(headers, formData.getHeaders());
  } else {
    // 其他模式（文本、视频等）：JSON 传输
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
