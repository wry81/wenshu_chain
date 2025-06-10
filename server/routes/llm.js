const express = require('express');
const auth = require('../middlewares/jwtauth');
const llmService = require('../services/llmService');

const router = express.Router();

// POST /api/llm/chat
router.post('/chat', auth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'prompt is required' });
  }

  try {
    const result = await llmService.chat(prompt);
    res.json(result);
  } catch (err) {
    console.error('LLM chat error:', err.message);
    res.status(500).json({ message: 'Failed to call LLM service' });
  }
});

module.exports = router;
