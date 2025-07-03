const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');

const STORAGE_DIR = path.join(__dirname, '..', 'storage');

async function getRunById(runId, userId) {
  const [rows] = await pool.query(
    `SELECT run_id, user_id, agent_id, status, current_node_id, node_results, create_time, update_time
     FROM wensoul_agent_runs WHERE run_id = ? AND user_id = ?`,
    [runId, userId]
  );
  return rows[0];
}

async function saveNodeOutput(runId, nodeId, userId) {
  const run = await getRunById(runId, userId);
  if (!run) {
    throw new Error('Run not found');
  }
  if (!run.node_results) {
    throw new Error('No node results recorded');
  }
  let results;
  try {
    results = typeof run.node_results === 'string' ? JSON.parse(run.node_results) : run.node_results;
  } catch (err) {
    throw new Error('Invalid node results format');
  }
  const nodeData = results[nodeId];
  if (!nodeData || !nodeData.output) {
    throw new Error('Node output not found');
  }
  const output = typeof nodeData.output === 'string' ? nodeData.output : JSON.stringify(nodeData.output);
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  const fileName = `run_${runId}_node_${nodeId}_${Date.now()}.txt`;
  const filePath = path.join(STORAGE_DIR, fileName);
  await fs.writeFile(filePath, output, 'utf8');
  const fileSize = Buffer.byteLength(output, 'utf8');
  const [result] = await pool.query(
    `INSERT INTO wensoul_user_storage_files
      (user_id, file_name, file_path, file_size, file_type, mime_type, metadata)
     VALUES (?, ?, ?, ?, 'workflow', 'text/plain', JSON_OBJECT('runId', ?, 'nodeId', ?))`,
    [userId, fileName, fileName, fileSize, runId, nodeId]
  );
  await pool.query(
    `UPDATE wensoul_user_storage SET used_space = used_space + ?, file_count = file_count + 1 WHERE user_id = ?`,
    [fileSize, userId]
  );
  return { fileId: result.insertId, fileName };
}

async function getNodeOutputFile(runId, nodeId, userId) {
  const [rows] = await pool.query(
    `SELECT file_name, file_path FROM wensoul_user_storage_files
     WHERE user_id = ? AND JSON_EXTRACT(metadata,'$.runId') = ?
       AND JSON_EXTRACT(metadata,'$.nodeId') = ? AND status = 1
     ORDER BY create_time DESC LIMIT 1`,
    [userId, runId, nodeId]
  );
  if (rows.length === 0) {
    throw new Error('File not found');
  }
  const { file_name: fileName, file_path: filePath } = rows[0];
  return { fileName, filePath: path.join(STORAGE_DIR, filePath) };
}

module.exports = {
  getRunById,
  saveNodeOutput,
  getNodeOutputFile,
};
