const pool = require('../config/db');
const { callLLM } = require('./llmService');

/**
 * 执行一个智能体的工作流
 * @param {number} agentId - 智能体ID
 * @param {string} initialInput - 初始输入
 * @returns {Promise<string>} - 最终输出
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
  let finalOutput;

  for (const node of workflow) {
    const { nodeType, model, promptTemplate } = node;
    // 确保 context 是字符串类型
    const currentInput = typeof context === 'string' ? context : JSON.stringify(context);
    const prompt = promptTemplate.replace('{{input}}', currentInput);

    if (nodeType === 'text-to-text') {
      const result = await callLLM({
        prompt: prompt,
        model: model
      });
      if (result.choices && result.choices.length > 0) {
        context = result.choices[0].message.content;
      } else {
        throw new Error('LLM call returned no choices.');
      }
    } else {
      console.warn(`Unsupported nodeType: ${nodeType}`);
      // 为了让流程继续，可以将当前 context 作为下一节点的输入
      context = `Unsupported node type ${nodeType}. Previous step output: ${context}`;
    }
    finalOutput = context;
  }

  return finalOutput;
}

module.exports = {
  runAgent,
};