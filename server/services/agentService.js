const pool = require('../config/db');
const { callLLM } = require('./llmService');

/**
 * 执行一个智能体的工作流或单个节点
 * @param {number} agentId - 智能体ID
 * @param {string} input - 输入数据
 * @param {string} [nodeId] - (可选) 要执行的特定节点ID
 * @param {number} userId - 发起运行的用户ID
 * @param {string} [runName] - (可选) 自定义的运行名称
 * @returns {Promise<any>} - 节点或工作流的最终输出
 */
async function runAgent(agentId, input, nodeId, userId, runName) {
  const [rows] = await pool.query(
    'SELECT workflow FROM wensoul_agent WHERE id = ? AND status = 1',
    [agentId]
  );
  if (rows.length === 0) {
    throw new Error('Agent not found or is inactive');
  }

  const workflow = rows[0].workflow;
  if (!Array.isArray(workflow) || workflow.length === 0) {
    throw new Error('Invalid or empty workflow');
  }

  // 如果提供了nodeId，则只执行该节点
  if (nodeId) {
    const node = workflow.find(n => n.nodeId === nodeId);
    if (!node) {
      throw new Error(`在Agent工作流中未找到ID为 ${nodeId} 的节点。`);
    }
    // 使用提供的输入直接执行单个节点
    return executeNode(node, input);
  }

  // -------- 完整工作流执行并记录运行信息 --------
  const [runInsert] = await pool.query(
    `INSERT INTO wensoul_agent_runs (user_id, agent_id, status, run_name, workflow_snapshot)
     VALUES (?, ?, 'running', ?, ?)`,
    [userId, agentId, runName || null, JSON.stringify(workflow)]
  );

  const runId = runInsert.insertId;

  let context = input;
  const nodeResults = {};

  for (const node of workflow) {
    const output = await executeNode(node, context);

    nodeResults[node.nodeId] = { input: context, output };

    await pool.query(
      `INSERT INTO wensoul_agent_run_nodes (run_id, node_id, node_name, input, output)
       VALUES (?, ?, ?, ?, ?)`,
      [runId, node.nodeId, node.nodeName, JSON.stringify(context), JSON.stringify(output)]
    );

    context = output;

    await pool.query(
      'UPDATE wensoul_agent_runs SET current_node_id = ? WHERE run_id = ?',
      [node.nodeId, runId]
    );
  }

  await pool.query(
    `UPDATE wensoul_agent_runs SET status = 'completed', node_results = ?, current_node_id = ?
     WHERE run_id = ?`,
    [JSON.stringify(nodeResults), workflow[workflow.length - 1].nodeId, runId]
  );

  return context;
}

/**
 * [最终版-简洁错误提示] 用于执行单个工作流节点的辅助函数
 * @param {object} node - 工作流节点对象
 * @param {any} input - 此节点的输入
 * @returns {Promise<string>} - 节点的输出（确保始终为字符串）
 */
async function executeNode(node, input) {
  const { nodeId, nodeName, nodeType, model, promptTemplate } = node;
  const currentInput = typeof input === 'string' ? input : JSON.stringify(input);
  const prompt = promptTemplate ? promptTemplate.replace('{{input}}', currentInput) : currentInput;

  let apiUrl;
  let payload;

  switch (nodeType) {
    case 'text-to-text':
      apiUrl = process.env.T2T_API_URL;
      payload = {
        model: model || process.env.LLM_MODEL,
        messages: [{ role: 'user', content: prompt }]
      };
      break;
    case 'text-to-image':
      apiUrl = process.env.T2I_API_URL;
      payload = {
        prompt: prompt,
        advanced_opt: {
          "height": 1024,
          "width": 1024,
          "num_images_per_prompt": 1
        }
      };
      break;

      case 'multi-to-text':
        // 图文问答：必须传 messages 数组
        apiUrl = process.env.I2T_API_URL;
        payload = {
          model: model || 'YuanjingVL',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
          // 如果需要，可以在这里附加 max_tokens, temperature...
        };
      break;

    case 'text-to-video':
      // 文本生成视频：先提交生成任务
      apiUrl = process.env.T2V_API_URL;
      payload = {
        prompt: prompt,
        model: unicom_t2v
      };
      break;

    case 'image-to-video':
      // 图生视频：将图片转换为视频
      apiUrl = process.env.I2V_API_URL;
      payload = {
        image: currentInput
      };
      break;

    default:
      console.warn(`[agentService] 不支持的节点类型: ${nodeType}`);
      return `[后端错误] 前端请求了一个不支持的节点类型: ${nodeType}。`;
  }

  try {
    const result = await callLLM({ apiUrl, payload, nodeType });

    // 检查并格式化成功返回
    if (nodeType === 'text-to-text') {
      if (result && result.choices?.[0]?.message?.content) {
        return result.choices[0].message.content;
      }
    } 
    else if (nodeType === 'text-to-image') {
      // 直接返回生成的Base64图片列表中的第一张
      if (result && (result.code === 0 || result.code === '0') 
          && Array.isArray(result.result) 
          && result.result.length > 0) {
        return result.result[0];
      }
    }
    else if (nodeType === 'multi-to-text') {
      // 同步返回多模态文本结果列表（result.result包含文本字符串）
      if (result && (result.code === 0 || result.code === '0')
          && Array.isArray(result.result) && result.result.length > 0) {
        return result.result[0];
      }
    }
    else if (nodeType === 'text-to-video') {
      // 异步流程：先返回 videoId，再去取最终视频链接
      if (result && (result.code === 0 || result.code === '0') && result.videoId) {
        const fetchResult = await callLLM({
          apiUrl: process.env.T2V_GET_URL,
          payload: { videoId: result.videoId },
          nodeType: 'text-to-video'
        });
        if (fetchResult && (fetchResult.code === 0 || fetchResult.code === '0') && fetchResult.url) {
          return fetchResult.url;
        }
      }
    }
    else if (nodeType === 'image-to-video') {
      // 异步流程：先返回 videoId，再去取最终视频链接
      if (result && (result.code === 0 || result.code === '0') && result.videoId) {
        const fetchResult = await callLLM({
          apiUrl: process.env.I2T_GET_URL,
          payload: { videoId: result.videoId },
          nodeType: 'image-to-video'
        });
        if (fetchResult && (fetchResult.code === 0 || fetchResult.code === '0') && fetchResult.url) {
          return fetchResult.url;
        }
      }
    }
    
    // 如果执行到这里，说明API响应了，但业务逻辑上失败了
    const errorMessage = result.message || '未知业务错误';
    console.error(`[agentService] 节点'${nodeName}'业务逻辑失败: ${errorMessage}`, result);
    // === 修改点：返回简洁的错误原因 ===
    return `[后端错误] 节点'${nodeName}'执行失败。原因: ${errorMessage} (详情请查看服务器日志)`;

  } catch (error) {
    // 如果axios请求直接失败
    console.error(`[agentService] 节点'${nodeName}'的API调用失败:`, error.message);
    // === 修改点：返回简洁的错误原因 ===
    return `[后端错误] 节点'${nodeName}'的API调用失败。原因: 无法连接到模型服务，请检查网络或联系管理员。`;
  }
}

/**
 * 获取指定运行的所有节点输入输出
 * @param {number} runId
 */
async function getRunNodeOutputs(runId) {
  const [rows] = await pool.query(
    'SELECT node_id, input, output FROM wensoul_agent_run_nodes WHERE run_id = ? ORDER BY id',
    [runId]
  );
  return rows;
}

/**
 * 从暂停状态继续执行工作流
 * @param {number} runId
 * @param {any} input - 如果需要，可以传入新的初始输入
 */
async function resumeAgentRun(runId, input) {
  const [runs] = await pool.query(
    'SELECT workflow_snapshot, status FROM wensoul_agent_runs WHERE run_id = ?',
    [runId]
  );
  if (runs.length === 0) {
    throw new Error('Run not found');
  }

  const run = runs[0];
  const workflow = JSON.parse(run.workflow_snapshot);

  const [nodes] = await pool.query(
    'SELECT node_id, output FROM wensoul_agent_run_nodes WHERE run_id = ? ORDER BY id',
    [runId]
  );

  let context = input;
  if (nodes.length > 0) {
    context = nodes[nodes.length - 1].output;
  }

  const executedIds = nodes.map(n => n.node_id);

  for (const node of workflow) {
    if (executedIds.includes(node.nodeId)) {
      continue;
    }

    const output = await executeNode(node, context);

    await pool.query(
      `INSERT INTO wensoul_agent_run_nodes (run_id, node_id, node_name, input, output)
       VALUES (?, ?, ?, ?, ?)`,
      [runId, node.nodeId, node.nodeName, JSON.stringify(context), JSON.stringify(output)]
    );

    context = output;
  }

  const nodeOutputs = await getRunNodeOutputs(runId);

  await pool.query(
    `UPDATE wensoul_agent_runs SET status = 'completed', node_results = ?, current_node_id = ? WHERE run_id = ?`,
    [JSON.stringify(nodeOutputs), workflow[workflow.length - 1].nodeId, runId]
  );

  return context;
}


module.exports = {
  runAgent,
  getRunNodeOutputs,
  resumeAgentRun,
};