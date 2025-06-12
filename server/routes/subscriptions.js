const express = require('express');
const auth = require('../middlewares/jwtauth');
const subscriptionService = require('../services/subscriptionService'); // 引入新的 service

const router = express.Router();

// 获取所有有效的订阅套餐
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getActivePlans();
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 用户订阅一个新套餐
router.post('/subscribe', auth, async (req, res) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ message: 'planId is required' });
  }

  try {
    await subscriptionService.subscribeToPlan(req.user.id, planId);
    res.json({ message: 'Subscription created successfully' });
  } catch (err) {
    console.error(err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message || 'Server error' });
  }
});

// 获取用户当前的有效订阅
router.get('/current', auth, async (req, res) => {
  try {
    const subscription = await subscriptionService.getCurrentSubscription(req.user.id);
    res.json(subscription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;