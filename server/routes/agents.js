// const express = require('express');
// const auth = require('../middlewares/jwtauth');
// const agentService = require('../services/agentService');
// const subscriptionService = require('../services/subscriptionService');

// const router = express.Router();

// // list available agents
// router.get('/', async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       'SELECT id, agent_name, agent_description FROM wensoul_agent WHERE status = 1'
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// router.post('/:id/run', auth, async (req, res) => {
//   // 从请求体中解构出 nodeId
//   const { input, nodeId, runName } = req.body;
//   const agentId = req.params.id;
//   const userId = req.user.id;
  
//   try {
//     const hasAccess = await subscriptionService.checkAgentAccess(userId, agentId);

//     if (!hasAccess) {
//       return res.status(403).json({ message: 'Access denied. You do not have an active subscription or have not purchased this agent.' });
//     }

//     // 将 input、nodeId 以及用户信息传递给服务
//     const result = await agentService.runAgent(agentId, input, nodeId, userId, runName);
//     res.json({ result });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;
const express = require('express');
const auth = require('../middlewares/jwtauth');
const agentService = require('../services/agentService');
const subscriptionService = require('../services/subscriptionService');
const pool = require('../config/db'); // 引入 pool 以便在路由层使用

const router = express.Router();

// list available agents (no changes here)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, agent_name, agent_description, agent_image FROM wensoul_agent WHERE status = 1'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// run agent workflow (REFACTORED)
router.post('/:id/run', auth, async (req, res) => {
  // 主要改动点 1：从请求体中解构出 runId 和 runName
  const { input, nodeId, runId, runName } = req.body;
  const agentId = req.params.id;
  const userId = req.user.id;
  
  try {
    const hasAccess = await subscriptionService.checkAgentAccess(userId, agentId);

    if (!hasAccess) {
      return res.status(403).json({ message: '访问被拒绝。您没有有效的订阅或未购买此智能体。' });
    }

    // 主要改动点 2：将 runId 和 runName 传递给服务层
    const result = await agentService.runAgent(agentId, input, nodeId, userId, runName, runId);
    
    // 主要改动点 3：直接返回服务层的结果，其中应包含 output 和 runId
    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
