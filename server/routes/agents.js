const express = require('express');
const pool = require('../config/db');
const auth = require('../middlewares/jwtauth');
const { runAgent, userHasActiveSubscription, userHasAgent } = require('../services/agentService');

const router = express.Router();

// list available agents
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, agent_name, agent_description FROM wensoul_agent WHERE status = 1'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// purchase single agent
router.post('/purchase', auth, async (req, res) => {
  const { agentId, duration } = req.body;
  if (!agentId || !duration) {
    return res.status(400).json({ message: 'agentId and duration required' });
  }
  try {
    const [agents] = await pool.query(
      'SELECT id FROM wensoul_agent WHERE id = ? AND status = 1',
      [agentId]
    );
    if (agents.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    const userId = req.user.id;
    await pool.query(
      'INSERT INTO wensoul_user_agent (user_id, agent_id, subscription_duration, subscription_expire_time) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))',
      [userId, agentId, duration, duration]
    );
    res.json({ message: 'Agent purchased' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// run agent workflow
router.post('/:id/run', auth, async (req, res) => {
  const { input } = req.body;
  const agentId = req.params.id;
  const userId = req.user.id;
  try {
    let hasAccess = await userHasActiveSubscription(userId);
    if (!hasAccess) {
      hasAccess = await userHasAgent(userId, agentId);
    }
    if (!hasAccess) {
      return res.status(403).json({ message: 'No active subscription for this agent' });
    }

    const result = await runAgent(agentId, input);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

