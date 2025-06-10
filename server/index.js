require('dotenv').config();

const express = require('express');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const llmRoutes = require('./routes/llm');

//验证是否调用了.env信息
console.log('> DB HOST:', process.env.DB_HOST);
console.log('> DB USER:', process.env.DB_USER);
console.log('> DB NAME:', process.env.DB_NAME);

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/llm', llmRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
