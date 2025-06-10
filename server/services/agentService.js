const pool = require('../config/db');
const axios = require('axios');
const { callLLM } = require('./llmService');

async function runAgent(agentId, input) {
  const [rows] = await pool.query(
    'SELECT workflow FROM wensoul_agent WHERE id = ? AND status = 1',
    [agentId]
  );
  if (rows.length === 0) {
    throw new Error('Agent not found');
  }
  const workflow = rows[0].workflow ? JSON.parse(rows[0].workflow) : [];
  let context = input;
  for (const step of workflow) {
    if (step.type === 'llm') {
      const result = await callLLM({
        prompt: context,
        model: step.model,
        apiUrl: step.apiUrl,
        apiKey: step.apiKey
      });
      context = result;
    } else if (step.type === 'http') {
      const { data } = await axios.post(step.apiUrl, { input: context });
      context = data;
    }
  }
  return context;
}

module.exports = {
  runAgent
};

