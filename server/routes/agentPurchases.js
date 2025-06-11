const express = require('express');
const auth = require('../middlewares/jwtauth');
const { purchaseAgent } = require('../services/agentService');

const router = express.Router();

// purchase single agent
router.post('/purchase', auth, async (req, res) => {
  const { agentId, duration } = req.body;
  if (!agentId || !duration) {
    return res.status(400).json({ message: 'agentId and duration required' });
  }
  try {
    await purchaseAgent({ userId: req.user.id, agentId, duration });
    res.json({ message: 'Agent purchased' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
