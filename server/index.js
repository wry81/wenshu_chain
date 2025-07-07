require('dotenv').config();

const express = require('express');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const llmRoutes = require('./routes/llm');
const agentRoutes = require('./routes/agents');
const agentPurchaseRoutes = require('./routes/agentPurchases');
const workflowRoutes = require('./routes/workflows');


//验证是否调用了.env信息
console.log('> DB HOST:', process.env.DB_HOST);
console.log('> DB USER:', process.env.DB_USER);
console.log('> DB NAME:', process.env.DB_NAME);

const app = express();

// 增加请求体大小限制，支持图片base64数据上传
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agents', agentPurchaseRoutes);
app.use('/api/workflows', workflowRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

