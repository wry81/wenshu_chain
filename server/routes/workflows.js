const express = require('express');
const auth = require('../middlewares/jwtauth');
const workflowService = require('../services/workflowService');
const path = require('path');

const router = express.Router();

// GET /api/workflows/:runId
router.get('/:runId', auth, async (req, res) => {
  const runId = req.params.runId;
  const userId = req.user.id;
  try {
    const run = await workflowService.getRunById(runId, userId);
    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }
    res.json(run);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/workflows/:runId/nodes/:nodeId/save
router.post('/:runId/nodes/:nodeId/save', auth, async (req, res) => {
  const { runId, nodeId } = req.params;
  const userId = req.user.id;
  try {
    const result = await workflowService.saveNodeOutput(runId, nodeId, userId);
    res.json({ message: 'saved', ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workflows/:runId/nodes/:nodeId/download
router.get('/:runId/nodes/:nodeId/download', auth, async (req, res) => {
  const { runId, nodeId } = req.params;
  const userId = req.user.id;
  try {
    const { filePath, fileName } = await workflowService.getNodeOutputFile(runId, nodeId, userId);
    res.download(filePath, fileName);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: err.message });
  }
});

module.exports = router;
