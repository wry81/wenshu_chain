const pool = require('../config/db');
const axios = require('axios');
const { callLLM } = require('./llmService');

async function userHasActiveSubscription(userId) {
  const [rows] = await pool.query(
    `SELECT id FROM wensoul_user_subscriptions
     WHERE user_id = ? AND status = 1 AND end_time > NOW()
     ORDER BY end_time DESC LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
}

async function userHasAgent(userId, agentId) {
  const [rows] = await pool.query(
    `SELECT id FROM wensoul_user_agent
     WHERE user_id = ? AND agent_id = ?
       AND status = 1 AND subscription_expire_time > NOW()
     ORDER BY subscription_expire_time DESC LIMIT 1`,
    [userId, agentId]
  );
  return rows.length > 0;
}

async function purchaseAgent({ userId, agentId, duration }) {
  const [agents] = await pool.query(
    'SELECT id FROM wensoul_agent WHERE id = ? AND status = 1',
    [agentId]
  );
  if (agents.length === 0) {
    throw new Error('Agent not found');
  }

  await pool.query(
    `INSERT INTO wensoul_user_agent (user_id, agent_id, subscription_duration, subscription_expire_time)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [userId, agentId, duration, duration]
  );
}

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
  runAgent,
  userHasActiveSubscription,
  userHasAgent,
  purchaseAgent
};

