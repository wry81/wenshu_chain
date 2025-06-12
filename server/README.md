# 后端服务说明

本目录为文枢链的后端代码，基于 Node.js 与 Express 框架实现。服务通过 MySQL 数据库存储用户、订阅及智能体等数据，并提供一组 REST API 供前端调用。

## 主要特性
- 使用 `express` 构建 API 服务
- 在 `config/db.js` 中配置 MySQL 连接池
- `middlewares/jwtauth.js` 实现 JWT 验证
- 路由按功能划分：auth、subscriptions、agents、agentPurchases、llm 等
- 服务层封装在 `services/` 内，包含智能体工作流与大模型调用逻辑
- 支持从 `.env` 文件读取环境变量，可参考 `.env.example`

## 目录结构
```
server/
├── config/                # 数据库连接配置
│   └── db.js
├── middlewares/           # 中间件
│   └── jwtauth.js
├── routes/                # 路由定义
│   ├── auth.js
│   ├── subscriptions.js
│   ├── agents.js
│   ├── agentPurchases.js
│   └── llm.js
├── services/              # 业务逻辑
│   ├── agentService.js
│   ├── purchaseService.js
│   ├── llmService.js
│   └── subsrciptionService.js
├── index.js               # 应用入口
├── package.json
└── .env.example           # 环境变量模板
```

## 快速开始
1. 进入此目录执行 `npm install` 安装依赖。
2. 将 `.env.example` 复制为 `.env`，填写数据库及 API 配置。
3. 执行 `npm start` 启动服务，默认监听 3000 端口。

## 常用接口
- `POST /api/auth/register` 用户注册
- `POST /api/auth/login` 用户登录并获取 JWT
- `GET /api/subscriptions/plans` 获取订阅套餐
- `POST /api/subscriptions/subscribe` 订阅指定套餐
- `GET /api/agents` 查询可用智能体
- `POST /api/agents/:id/run` 运行智能体工作流
