const pool = require('../config/db');
const { callLLM } = require('./llmService');

/**
 * 执行一个智能体的工作流
 * @param {number} agentId - 智能体ID
 * @param {string} initialInput - 初始输入
 * @returns {Promise<any>} - 最终输出
 */
async function runAgent(agentId, initialInput) {
  const [rows] = await pool.query(
    'SELECT workflow FROM wensoul_agent WHERE id = ? AND status = 1',
    [agentId]
  );
  if (rows.length === 0) {
    throw new Error('Agent not found or is inactive');
  }

  const workflow = rows[0].workflow;
  if (!Array.isArray(workflow) || workflow.length === 0) {
    throw new Error('Invalid or empty workflow');
  }

  let context = initialInput;

  for (const node of workflow) {
    const { nodeType, model, promptTemplate } = node;
    const currentInput = typeof context === 'string' ? context : JSON.stringify(context);
    const prompt = promptTemplate.replace('{{input}}', currentInput);

    let apiUrl;
    let payload;
    // 根据节点类型选择对应的API URL 并构建相应的payload
    switch (nodeType) {
      case 'text-to-text':
        apiUrl = process.env.T2T_API_URL;
        payload = {
          model: model || process.env.LLM_MODEL,
          messages: [{ role: 'user', content: prompt }]
        };
        break;
      case 'text-to-image':
        apiUrl = process.env.T2I_API_URL;

        // 1. 创建一个 FormData 实例
        const formData = new FormData();

        // 2. 将高级参数构建为一个对象
        const advancedOptions = {
          "height": 1024,
          "width": 1024,
          "num_images_per_prompt": 1
        };

        // 3. 按照 --form 的要求，分别追加 prompt 和 advanced_opt 字段
        formData.append('prompt', prompt);
        formData.append('advanced_opt', JSON.stringify(advancedOptions));

        // 4. 将 payload 设置为这个 FormData 实例
        payload = formData;
        
        break;
      case 'image-to-image':
        apiUrl = process.env.I2I_API_URL;
        payload = {
          prompt,
          model: model || process.env.LLM_MODEL,
          image: currentInput
        };
        break;
      case 'image-to-model':
        apiUrl = process.env.I2M_API_URL;
        payload = {
          image: currentInput,
          model: model || process.env.LLM_MODEL
        };
        break;
      default:
        console.warn(`Unsupported nodeType: ${nodeType}`);
        context = `Unsupported node type ${nodeType}. Previous step output: ${context}`;
        continue; // 跳过当前循环
    }

    const result = await callLLM({
      apiUrl,
      payload
    });

    // 这里需要根据不同API的返回结构来解析输出
    if (nodeType === 'text-to-text') {
      if (result.choices && result.choices.length > 0) {
        context = result.choices[0].message.content;
      } else {
        throw new Error('LLM call returned no text choices.');
      }
    } else if (nodeType === 'text-to-image') {
      // --- 修改开始 ---
      // 检查 API 是否成功接收了任务
      if (result && result.code === '0' && result.lid) {
        // 直接返回任务 ID (lid)，而不是尝试寻找不存在的图片 URL
        context = `任务已提交，处理ID为: ${result.lid}`; 
      } else {
        // 如果没有成功接收，则抛出更详细的错误
        throw new Error(`Text-to-image task submission failed. API response: ${JSON.stringify(result)}`);
      }
      // --- 修改结束 ---
    } else if (nodeType === 'image-to-image') { 
        // ... image-to-image 的逻辑也可能需要类似修改 ...
        if (result.data && result.data.length > 0) {
            context = result.data[0].url; 
        } else {
            throw new Error('LLM call returned no image data.');
        }
    } else if (nodeType === 'image-to-model') {
      context = result;
    } else {
      context = result;
    }
  }

  return context; // 返回最后一个节点的输出
}

module.exports = {
  runAgent,
};