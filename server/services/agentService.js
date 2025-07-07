const pool = require('../config/db');
const { callLLM } = require('./llmService');

/**
 * [重构版] 执行一个智能体的工作流节点，并在首次执行时创建运行实例
 * @param {number} agentId - 智能体ID
 * @param {string} input - 当前节点的输入数据
 * @param {string} nodeId - 需要执行的特定节点ID
 * @param {number} userId - 发起运行的用户ID
 * @param {string} [runName] - (可选) 用户为新工作流定义的名称
 * @param {number} [existingRunId] - (可选) 如果是已存在的工作流，则传入其ID
 * @returns {Promise<object>} - 返回一个包含 { result, runId } 的对象
 */
async function runAgent(agentId, input, nodeId, userId, runName, existingRunId) {
  const [agentRows] = await pool.query(
    'SELECT workflow FROM wensoul_agent WHERE id = ? AND status = 1',
    [agentId]
  );
  if (agentRows.length === 0) {
    throw new Error('智能体未找到或未激活');
  }

  const workflow = agentRows[0].workflow;
  if (!Array.isArray(workflow) || workflow.length === 0) {
    throw new Error('无效或空的工作流');
  }

  const node = workflow.find(n => n.nodeId === nodeId);
  if (!node) {
    throw new Error(`在工作流中未找到ID为 ${nodeId} 的节点。`);
  }

  let runId = existingRunId;

  // 主要改动点 1：如果 runId 不存在，则创建新的运行实例
  if (!runId) {
    const [runInsert] = await pool.query(
      `INSERT INTO wensoul_agent_runs (user_id, agent_id, status, run_name, workflow_snapshot)
       VALUES (?, ?, 'running', ?, ?)`,
      [userId, agentId, runName || `运行实例 ${Date.now()}`, JSON.stringify(workflow)]
    );
    runId = runInsert.insertId;
  }

  // 主要改动点 2：执行单个节点
  const output = await executeNode(node, input);

  // 主要改动点 3：将当前节点的输入输出记录到 wensoul_agent_run_nodes 表
  await pool.query(
    `INSERT INTO wensoul_agent_run_nodes (run_id, node_id, node_name, input, output)
     VALUES (?, ?, ?, ?, ?)`,
    [runId, node.nodeId, node.nodeName, JSON.stringify(input), JSON.stringify(output)]
  );
  
  // 主要改动点 4：更新 wensoul_agent_runs 表中的聚合结果和当前状态
  // 使用事务确保数据一致性
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [currentRuns] = await connection.query('SELECT node_results FROM wensoul_agent_runs WHERE run_id = ? FOR UPDATE', [runId]);
    const currentResults = currentRuns[0].node_results ? JSON.parse(currentRuns[0].node_results) : {};
    
    currentResults[nodeId] = { input, output };

    await connection.query(
      `UPDATE wensoul_agent_runs SET current_node_id = ?, node_results = ? WHERE run_id = ?`,
      [nodeId, JSON.stringify(currentResults), runId]
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  // 主要改动点 5：返回结果和 runId
  return { result: output, runId: runId };
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
      apiUrl = process.env.I2T_API_URL;
      
      // unicomiqa40B模型使用multipart/form-data格式
      // 根据输入类型决定功能选项
      let apiOption = 'general'; // 默认通用场景
      
      // 检查输入是否包含图像
      let hasImage = false;
      let imageData = null;
      
      if (typeof currentInput === 'string' && 
          (currentInput.startsWith('data:image/') || currentInput.startsWith('http'))) {
        hasImage = true;
        imageData = currentInput;
        // 根据prompt内容智能选择功能
        if (prompt && (prompt.includes('数学') || prompt.includes('计算') || prompt.includes('公式'))) {
          apiOption = 'math';
        } else if (prompt && (prompt.includes('OCR') || prompt.includes('文字识别') || prompt.includes('提取文字'))) {
          apiOption = 'ocr';
        }
      }
      
      // 构建multipart/form-data格式的payload
      payload = {
        prompt: prompt || '请分析这张图片',
        stream: 0, // 非流式
        api_option: apiOption,
        // 如果有图像，添加img参数
        ...(hasImage && imageData ? { img: imageData } : {}),
        // 如果是多轮对话，可以添加history参数
        // history: JSON.stringify([]) // 暂时为空数组
      };
      
      // 标记这是multipart请求
      payload._isMultipart = true;
      break;
    case 'text-to-video':
      // 文本生成视频：先提交生成任务
      apiUrl = process.env.T2V_API_URL;
      payload = {
        prompt: prompt,
        model: "unicom_t2v"
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
      return `[后端错误] 不支持的节点类型: ${nodeType}。`;
  }

  try {
    const result = await callLLM({ apiUrl, payload, nodeType });
    
    // 添加调试日志，记录API返回的完整结果
    console.log(`[agentService] 节点'${nodeName}'(${nodeType})的API返回结果:`, JSON.stringify(result, null, 2));

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
      // unicomiqa40B模型返回格式处理
      if (result && (result.code === 0 || result.code === '0')) {
        // 检查不同可能的返回格式
        if (result.data && typeof result.data === 'string') {
          return result.data;
        }
        if (result.result && typeof result.result === 'string') {
          return result.result;
        }
        if (Array.isArray(result.result) && result.result.length > 0) {
          return result.result[0];
        }
      }
      // 兼容原有的OpenAI格式（向后兼容）
      else if (result && result.choices?.[0]?.message?.content) {
        return result.choices[0].message.content;
      }
    }
    else if (nodeType === 'text-to-video') {
      // 处理文本生成视频的返回结果
      if (result && (result.code === 0 || result.code === '0')) {
        // 检查不同可能的返回格式
        if (result.data) {
          // 如果直接返回视频文件名或URL
          if (typeof result.data === 'string') {
            // 检查是否为完整URL
            if (result.data.startsWith('http')) {
              return result.data;
            } else {
              // 如果是文件名，需要构建完整URL
              const baseUrl = process.env.T2V_API_URL || 'https://your-video-service.com/videos/';
              return `${baseUrl}${result.data}`;
            }
          }
        }
        
        // 检查resourceId字段
        if (result.resourceId) {
          // 如果返回resourceId，可能需要进一步查询
          if (result.resourceId.startsWith('http')) {
            return result.resourceId;
          } else {
            // 构建完整URL
            const baseUrl = process.env.T2V_API_URL || 'https://your-video-service.com/videos/';
            return `${baseUrl}${result.resourceId}`;
          }
        }
        
        // 如果有videoId，使用原有的异步查询逻辑
        if (result.videoId) {
          const fetchResult = await callLLM({
            apiUrl: process.env.T2V_GET_URL,
            payload: { videoId: result.videoId },
            nodeType: 'text-to-video'
          });
          if (fetchResult && (fetchResult.code === 0 || fetchResult.code === '0') && fetchResult.url) {
            return fetchResult.url;
          }
        }
        
        // 如果有url字段，直接返回
        if (result.url) {
          return result.url;
        }
        
        // 如果result本身就是视频URL字符串
        if (typeof result === 'string' && (result.startsWith('http') || result.endsWith('.mp4'))) {
          return result;
        }
      }
    }
    else if (nodeType === 'image-to-video') {
      // 处理图像生成视频的返回结果
      if (result && (result.code === 0 || result.code === '0')) {
        // 检查不同可能的返回格式
        if (result.data) {
          // 如果直接返回视频文件名或URL
          if (typeof result.data === 'string') {
            // 检查是否为完整URL
            if (result.data.startsWith('http')) {
              return result.data;
            } else {
              // 如果是文件名，需要构建完整URL
              const baseUrl = process.env.I2V_API_URL || 'https://your-video-service.com/videos/';
              return `${baseUrl}${result.data}`;
            }
          }
        }
        
        // 检查resourceId字段
        if (result.resourceId) {
          // 如果返回resourceId，可能需要进一步查询
          if (result.resourceId.startsWith('http')) {
            return result.resourceId;
          } else {
            // 构建完整URL
            const baseUrl = process.env.I2V_API_URL || 'https://your-video-service.com/videos/';
            return `${baseUrl}${result.resourceId}`;
          }
        }
        
        // 如果有videoId，使用原有的异步查询逻辑
        if (result.videoId) {
          const fetchResult = await callLLM({
            apiUrl: process.env.I2V_GET_URL,
            payload: { videoId: result.videoId },
            nodeType: 'image-to-video'
          });
          if (fetchResult && (fetchResult.code === 0 || fetchResult.code === '0') && fetchResult.url) {
            return fetchResult.url;
          }
        }
        
        // 如果有url字段，直接返回
        if (result.url) {
          return result.url;
        }
        
        // 如果result本身就是视频URL字符串
        if (typeof result === 'string' && (result.startsWith('http') || result.endsWith('.mp4'))) {
          return result;
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
    return `[后端错误] 节点'${nodeName}'的API调用失败。原因: ${error.message}`;
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