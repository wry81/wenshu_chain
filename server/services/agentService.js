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
        payload = {
          prompt,
          model: model || process.env.LLM_MODEL,
          n: 1,
          size: '1024x1024'
        };
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
    // 例如，文本API返回在 choices[0].message.content
    // 图片API可能返回在 data[0].url
    if (nodeType === 'text-to-text') {
      if (result.choices && result.choices.length > 0) {
        context = result.choices[0].message.content;
      } else {
        throw new Error('LLM call returned no text choices.');
      }
    } else if (nodeType === 'text-to-image' || nodeType === 'image-to-image') {
      if (result.data && result.data.length > 0) {
        context = result.data[0].url; // 假设返回图片URL
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