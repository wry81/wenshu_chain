const pool = require('../config/db');

async function getActivePlans() {
  const [rows] = await pool.query(
    'SELECT id, plan_name, plan_code, description, price FROM wensoul_subscription_plans WHERE is_active = 1 ORDER BY sort_order'
  );
  return rows;
}

async function subscribeToPlan(userId, planId) {
  const [plans] = await pool.query(
    'SELECT id FROM wensoul_subscription_plans WHERE id = ? AND is_active = 1',
    [planId]
  );
  if (plans.length === 0) {
    const error = new Error('Plan not found or is not active');
    error.statusCode = 404;
    throw error;
  }
  await pool.query(
    `INSERT INTO wensoul_user_subscriptions (user_id, plan_id, start_time, end_time, status, auto_renew, amount_paid)
     VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 1, 0, 0.00)`,
    [userId, planId]
  );
  await pool.query('UPDATE wensoul_user SET current_plan_id = ? WHERE id = ?', [planId, userId]);
}

async function getCurrentSubscription(userId) {
  const [rows] = await pool.query(
    `SELECT sp.plan_name, sp.plan_code, sp.price, us.start_time, us.end_time
     FROM wensoul_user_subscriptions us
     JOIN wensoul_subscription_plans sp ON us.plan_id = sp.id
     WHERE us.user_id = ? AND us.status = 1
     ORDER BY us.end_time DESC LIMIT 1`,
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}


/**
 * [内部函数] 检查用户是否有任何有效的订阅套餐
 * @param {number} userId - 用户ID
 * @returns {Promise<boolean>}
 */
async function userHasActiveSubscription(userId) {
    const [rows] = await pool.query(
      `SELECT id FROM wensoul_user_subscriptions
       WHERE user_id = ? AND status = 1 AND end_time > NOW()
       LIMIT 1`,
      [userId]
    );
    return rows.length > 0;
}

/**
 * [内部函数] 检查用户是否单独购买了某个Agent
 * @param {number} userId - 用户ID
 * @param {number} agentId - 智能体ID
 * @returns {Promise<boolean>}
 */
async function userHasPurchasedAgent(userId, agentId) {
  const [rows] = await pool.query(
    `SELECT id FROM wensoul_user_agent
     WHERE user_id = ? AND agent_id = ?
       AND status = 1 AND subscription_expire_time > NOW()
       LIMIT 1`,
    [userId, agentId]
  );
  return rows.length > 0;
}

/**
 * [统一入口] 检查用户是否有权限运行指定的Agent
 * 这是提供给路由层的唯一权限检查函数
 * @param {number} userId - 用户ID
 * @param {number} agentId - 智能体ID
 * @returns {Promise<boolean>}
 */
async function checkAgentAccess(userId, agentId) {
  // 1. 首先检查用户是否有全局的有效套餐订阅
  const hasPlan = await userHasActiveSubscription(userId);
  if (hasPlan) {
    return true; // 有套餐，直接拥有所有Agent权限
  }

  // 2. 如果没有套餐，再检查是否单独购买了此Agent
  return await userHasPurchasedAgent(userId, agentId);
}

module.exports = {
  getActivePlans,
  subscribeToPlan,
  getCurrentSubscription,
  checkAgentAccess, // 对外暴露统一的权限检查入口
};