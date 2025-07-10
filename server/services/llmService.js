const axios = require('axios');
const FormData = require('form-data');

async function callLLM({ payload, prompt, model, apiUrl, apiKey, nodeType }) {
  console.log(`[llmService] Node type: ${nodeType || 'default'}`);

  let finalApiKey, finalUrl;
  
  if (nodeType === 'image-to-model') {
    // 3D模型生成：使用特殊的API配置
    finalApiKey = process.env.TRIPO_API_KEY;
    finalUrl = apiUrl || process.env.I2M_API_URL; // 使用正确的I2M_API_URL
    
    if (!finalApiKey) {
      throw new Error('TRIPO API key not configured');
    }
    if (!finalUrl) {
      throw new Error('I2M API URL not configured');
    }
  } else {
    // 其他节点类型使用默认配置
    finalApiKey = apiKey || process.env.LLM_API_KEY;
    finalUrl = apiUrl || process.env.LLM_API_URL;

  if (!finalApiKey) {
    throw new Error('LLM API key not configured');
    }
  }

  let body;
  const headers = {
    Authorization: `Bearer ${finalApiKey}`
  };

  if (nodeType === 'image-to-model') {
    // 3D模型生成：需要先上传图片，再提交任务
    
    // 处理图片数据：如果是base64格式，需要先上传获取file_token
    if (payload.file && payload.file.file_token) {
      if (typeof payload.file.file_token === 'string' && payload.file.file_token.startsWith('data:image/')) {
        console.log('[llmService] 开始上传图片获取file_token');
        
        try {
          // 第一步：上传图片获取file_token
          const fileToken = await uploadImageForTripo(payload.file.file_token, finalApiKey);
          console.log('[llmService] 图片上传成功，获得file_token:', fileToken);
          
          // 更新payload中的file_token
          payload.file.file_token = fileToken;
        } catch (uploadError) {
          console.error('[llmService] 图片上传失败:', uploadError);
          throw new Error(`图片上传失败: ${uploadError.message}`);
        }
      }
    }
    
    // 第二步：提交3D模型生成任务
    headers['Content-Type'] = 'application/json';
    body = payload;
    
    // 添加调试日志
    console.log('[llmService] 即将发送到3D模型API的payload:', JSON.stringify(payload, null, 2));
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

// 上传图片到Tripo3D并获取file_token
async function uploadImageForTripo(base64Image, apiKey) {
  try {
    // 解析base64图片数据
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || !matches[2]) {
      throw new Error('无效的base64图片格式');
    }
    
    const imageType = matches[1]; // jpeg, png等
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 创建FormData用于上传
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: `image.${imageType}`,
      contentType: `image/${imageType}`
    });
    
    // 上传API的URL（根据API文档：直接上传方法）
    const uploadUrl = 'https://api.tripo3d.ai/v2/openapi/upload/sts';
    
    console.log('[llmService] 正在上传图片到:', uploadUrl);
    
    const { data } = await axios.post(uploadUrl, formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('[llmService] 上传响应:', JSON.stringify(data, null, 2));
    
    // 根据API文档，返回字段应该是 image_token
    if (data && data.image_token) {
      return data.image_token;
    } else if (data && data.data && data.data.image_token) {
      return data.data.image_token;
    } else {
      console.error('[llmService] 未找到image_token，完整响应:', data);
      throw new Error('上传响应中未找到image_token');
    }
    
  } catch (error) {
    console.error('[llmService] 图片上传错误:', error);
    if (error.response) {
      console.error('上传错误详情:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    throw error;
  }
}

async function chat(prompt) {
  return callLLM({ prompt });
}

module.exports = {
  chat,
  callLLM
};
