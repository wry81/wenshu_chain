const pool = require('../config/db');

/**
 * 为用户购买指定的智能体
 * @param {object} options
 * @param {number} options.userId - 用户ID
 * @param {number} options.agentId - 智能体ID
 * @param {number} options.duration - 购买天数
 */
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

module.exports = {
  purchaseAgent,
};