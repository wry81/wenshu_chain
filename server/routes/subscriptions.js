const express = require('express');
const pool = require('../config/db');
const auth = require('../middlewares/jwtauth');

const router = express.Router();

// Get list of active subscription plans
router.get('/plans', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, plan_name, plan_code, description, price FROM wensoul_subscription_plans WHERE is_active = 1 ORDER BY sort_order'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Subscribe current user to a plan
router.post('/subscribe', auth, async (req, res) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ message: 'planId required' });
  }

  try {
    // Ensure plan exists and active
    const [plans] = await pool.query(
      'SELECT id FROM wensoul_subscription_plans WHERE id = ? AND is_active = 1',
      [planId]
    );
    if (plans.length === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const userId = req.user.id;
    // Insert subscription (one month by default)
    await pool.query(
      `INSERT INTO wensoul_user_subscriptions (user_id, plan_id, start_time, end_time, status, auto_renew, amount_paid)
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 1, 0, 0.00)`,
      [userId, planId]
    );
    // Update user's current plan
    await pool.query('UPDATE wensoul_user SET current_plan_id = ? WHERE id = ?', [planId, userId]);

    res.json({ message: 'Subscription created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's active subscription
router.get('/current', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT sp.plan_name, sp.plan_code, sp.price, us.start_time, us.end_time
       FROM wensoul_user_subscriptions us
       JOIN wensoul_subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = ? AND us.status = 1
       ORDER BY us.end_time DESC LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) {
      return res.json(null);
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
