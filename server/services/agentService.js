const pool = require('../config/db');
const { callLLM } = require('./llmService');

/**
 * 执行一个智能体的工作流或单个节点
 * @param {number} agentId - 智能体ID
 * @param {string} input - 输入数据
 * @param {string} [nodeId] - (可选) 要执行的特定节点ID
 * @returns {Promise<any>} - 节点或工作流的最终输出
 */
async function runAgent(agentId, input, nodeId) {
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

  // 如果提供了nodeId，则只执行该节点
  if (nodeId) {
    const node = workflow.find(n => n.nodeId === nodeId);
    if (!node) {
      throw new Error(`在Agent工作流中未找到ID为 ${nodeId} 的节点。`);
    }
    // 使用提供的输入直接执行单个节点
    return executeNode(node, input);
  }

  // --- 保留原始的完整工作流执行逻辑 ---
  let context = input;
  for (const node of workflow) {
    // 将上一步的输出作为当前步骤的输入
    context = await executeNode(node, context);
  }

  return context;
}

/**
 * [最终版-简洁错误提示] 用于执行单个工作流节点的辅助函数
 * @param {object} node - 工作流节点对象
 * @param {any} input - 此节点的输入
 * @returns {Promise<string>} - 节点的输出（确保始终为字符串）
 */
async function executeNode(node, input) {
  const { nodeId, nodeName, nodeType, model, promptTemplate } = node;
  const currentInput = typeof input === 'string' ? input : JSON.stringify(input);
  const prompt = promptTemplate ? promptTemplate.replace('{{input}}', currentInput) : currentInput;

  let apiUrl;
  let payload;

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
        prompt: prompt,
        advanced_opt: {
          "height": 1024,
          "width": 1024,
          "num_images_per_prompt": 1
        }
      };
      break;
    default:
      console.warn(`[agentService] 不支持的节点类型: ${nodeType}`);
      return `[后端错误] 前端请求了一个不支持的节点类型: ${nodeType}。`;
  }

  try {
    const result = await callLLM({ apiUrl, payload, nodeType });

    // 检查并格式化成功返回
    if (nodeType === 'text-to-text') {
      if (result && result.choices?.[0]?.message?.content) {
        return result.choices[0].message.content;
      }
    } 
    else if (nodeType === 'text-to-image') {
      // 直接返回生成的Base64图片列表中的第一张
      if (result && (result.code === 0 || result.code === '0') 
          && Array.isArray(result.result) 
          && result.result.length > 0) {
        return result.result[0];
      }
    }
    
    // 如果执行到这里，说明API响应了，但业务逻辑上失败了
    const errorMessage = result.message || '未知业务错误';
    console.error(`[agentService] 节点'${nodeName}'业务逻辑失败: ${errorMessage}`, result);
    // === 修改点：返回简洁的错误原因 ===
    return `[后端错误] 节点'${nodeName}'执行失败。原因: ${errorMessage} (详情请查看服务器日志)`;

  } catch (error) {
    // 如果axios请求直接失败
    console.error(`[agentService] 节点'${nodeName}'的API调用失败:`, error.message);
    // === 修改点：返回简洁的错误原因 ===
    return `[后端错误] 节点'${nodeName}'的API调用失败。原因: 无法连接到模型服务，请检查网络或联系管理员。`;
  }
}


module.exports = {
  runAgent,
};