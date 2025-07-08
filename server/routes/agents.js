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
  // 主要改动点 1：从请求体中解构出 runId 和 runName，以及额外的 prompt 参数
  const { input, nodeId, runId, runName, prompt } = req.body;
  const agentId = req.params.id;
  const userId = req.user.id;
  
  try {
    const hasAccess = await subscriptionService.checkAgentAccess(userId, agentId);

    if (!hasAccess) {
      return res.status(403).json({ message: '访问被拒绝。您没有有效的订阅或未购买此智能体。' });
    }

    // 主要改动点 2：将 runId、runName 和 prompt 传递给服务层
    const result = await agentService.runAgent(agentId, input, nodeId, userId, runName, runId, prompt);
    
    // 主要改动点 3：直接返回服务层的结果，其中应包含 output 和 runId
    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// 查询3D模型生成任务状态
router.get('/task/:taskId/status', auth, async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;
  
  try {
    // 调用Tripo3D API查询任务状态
    const axios = require('axios');
    
    // 使用正确的API密钥
    const apiKey = process.env.TRIPO_API_KEY;
    
    // 尝试正确的API端点
    const apiUrl = `https://api.tripo3d.ai/v2/openapi/task/${taskId}`;
    
    console.log(`[agents] 查询任务状态: ${apiUrl}`);
    console.log(`[agents] 使用API密钥: ${apiKey ? '已配置' : '未配置'}`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const taskData = response.data;
    console.log(`[agents] 任务${taskId}状态查询结果:`, JSON.stringify(taskData, null, 2));
    
    // 处理不同的响应格式
    let status = 'unknown';
    let progress = 0;
    let result = null;
    let error = null;
    
    if (taskData) {
      // 检查不同的数据结构
      if (taskData.data) {
        status = taskData.data.status || taskData.data.state || 'unknown';
        progress = taskData.data.progress || 0;
        result = taskData.data.result || taskData.data.output || null;
        error = taskData.data.error || taskData.data.fail_reason || null;
      } else if (taskData.status || taskData.state) {
        status = taskData.status || taskData.state;
        progress = taskData.progress || 0;
        result = taskData.result || taskData.output || null;
        error = taskData.error || taskData.fail_reason || null;
      }
    }
    
    console.log(`[agents] 解析后的状态信息:`, {
      status,
      progress,
      hasResult: !!result,
      hasError: !!error
    });
    
    // 返回任务状态信息
    res.json({
      success: true,
      taskId,
      status,
      progress,
      result,
      error,
      message: getStatusMessage(status)
    });
    
  } catch (error) {
    console.error(`[agents] 查询任务${taskId}状态失败:`, error);
    
    if (error.response) {
      console.error('API响应错误:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // 如果是401错误，可能是API密钥问题
      if (error.response.status === 401) {
        return res.status(500).json({
          success: false,
          taskId,
          message: 'API密钥验证失败，请检查TRIPO_API_KEY配置',
          error: 'Unauthorized'
        });
      }
      
      // 如果是404错误，可能是任务不存在或API端点错误
      if (error.response.status === 404) {
        return res.status(404).json({
          success: false,
          taskId,
          message: '任务不存在或API端点错误',
          error: 'Task not found'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      taskId,
      message: '查询任务状态失败',
      error: error.message
    });
  }
});

// 获取任务状态对应的中文消息
function getStatusMessage(status) {
  const statusMessages = {
    'queued': '任务已排队，等待处理',
    'running': '任务正在运行中',
    'success': '任务已完成',
    'failed': '任务执行失败',
    'cancelled': '任务已取消'
  };
  return statusMessages[status] || '未知状态';
}

// 获取用户的历史记录列表
router.get('/history', auth, async (req, res) => {
  const userId = req.user.id;
  const { agentId, page = 1, limit = 20 } = req.query;
  
  try {
    let whereClause = 'r.user_id = ?';
    let queryParams = [userId];
    
    // 如果指定了agentId，只查询特定agent的历史
    if (agentId) {
      whereClause += ' AND r.agent_id = ?';
      queryParams.push(agentId);
    }
    
    const offset = (page - 1) * limit;
    queryParams.push(parseInt(limit), offset);
    
    const [rows] = await pool.query(`
      SELECT 
        r.run_id,
        r.run_name,
        r.agent_id,
        r.status,
        r.create_time,
        r.update_time,
        r.current_node_id,
        a.agent_name,
        a.agent_description,
        COUNT(n.id) as node_count
      FROM wensoul_agent_runs r
      LEFT JOIN wensoul_agent a ON r.agent_id = a.id
      LEFT JOIN wensoul_agent_run_nodes n ON r.run_id = n.run_id
      WHERE ${whereClause}
      GROUP BY r.run_id
      ORDER BY r.create_time DESC
      LIMIT ? OFFSET ?
    `, queryParams);
    
    // 获取总数
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM wensoul_agent_runs r
      WHERE ${whereClause}
    `, queryParams.slice(0, -2)); // 移除LIMIT和OFFSET参数
    
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('[agents] 获取历史记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败',
      error: error.message
    });
  }
});

// 获取单个运行记录的详细信息
router.get('/history/:runId', auth, async (req, res) => {
  const userId = req.user.id;
  const { runId } = req.params;
  
  try {
    // 获取运行记录基本信息
    const [runRows] = await pool.query(`
      SELECT 
        r.*,
        a.agent_name,
        a.agent_description
      FROM wensoul_agent_runs r
      LEFT JOIN wensoul_agent a ON r.agent_id = a.id
      WHERE r.run_id = ? AND r.user_id = ?
    `, [runId, userId]);
    
    if (runRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该运行记录'
      });
    }
    
    // 获取节点详细记录
    const [nodeRows] = await pool.query(`
      SELECT 
        node_id,
        node_name,
        input,
        output,
        create_time
      FROM wensoul_agent_run_nodes
      WHERE run_id = ?
      ORDER BY id
    `, [runId]);
    
    const runData = runRows[0];
    runData.nodes = nodeRows.map(node => ({
      ...node,
      input: typeof node.input === 'string' ? JSON.parse(node.input) : node.input,
      output: typeof node.output === 'string' ? JSON.parse(node.output) : node.output
    }));
    
    res.json({
      success: true,
      data: runData
    });
    
  } catch (error) {
    console.error('[agents] 获取运行详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取运行详情失败',
      error: error.message
    });
  }
});

module.exports = router;
