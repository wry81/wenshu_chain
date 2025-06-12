const express = require('express');
const auth = require('../middlewares/jwtauth');
const { purchaseAgent } = require('../services/purchaseService');

const router = express.Router();

// purchase single agent
router.post('/purchase', auth, async (req, res) => {
  const { agentId, duration } = req.body;
  if (!agentId || !duration) {
    return res.status(400).json({ message: 'agentId and duration are required' });
  }
  try {
    await purchaseAgent({ userId: req.user.id, agentId, duration });
    res.json({ message: 'Agent purchased successfully' });
  } catch (err) {
    console.error(err);
    // 可以在这里根据错误类型返回更具体的HTTP状态码，但500是通用的服务器错误
    res.status(500).json({ message: 'Failed to purchase agent' });
  }
});

module.exports = router;