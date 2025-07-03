const express = require('express');
const auth = require('../middlewares/jwtauth');
const agentService = require('../services/agentService');
const subscriptionService = require('../services/subscriptionService');

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


// run agent workflow
// router.post('/:id/run', auth, async (req, res) => {
//   const { input } = req.body;
//   const agentId = req.params.id;
//   const userId = req.user.id;
  
//   try {
//     // **核心改变：调用统一的权限检查函数**
//     const hasAccess = await subscriptionService.checkAgentAccess(userId, agentId);

//     if (!hasAccess) {
//       return res.status(403).json({ message: 'Access denied. You do not have an active subscription or have not purchased this agent.' });
//     }

//     const result = await agentService.runAgent(agentId, input);
//     res.json({ result });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });

router.post('/:id/run', auth, async (req, res) => {
  // 从请求体中解构出 nodeId
  const { input, nodeId, runName } = req.body;
  const agentId = req.params.id;
  const userId = req.user.id;
  
  try {
    const hasAccess = await subscriptionService.checkAgentAccess(userId, agentId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You do not have an active subscription or have not purchased this agent.' });
    }

    // 将 input、nodeId 以及用户信息传递给服务
    const result = await agentService.runAgent(agentId, input, nodeId, userId, runName);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

