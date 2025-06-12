# 后端服務說明

本目錄為文枢鏈的後端代碼，基於 Node.js 與 Express 框架實現。服務通過 MySQL 數據庫存儲用戶、訂閱及智能體等資料，並提供一組 REST API 供前端調用。

## 主要特性
- 使用 `express` 構建 API 服務
- 在 `config/db.js` 中配置 MySQL 連接池
- `middlewares/jwtauth.js` 實現 JWT 驗證
- 路由按功能劃分：auth、subscriptions、agents、agentPurchases、llm 等
- 服務層封裝在 `services/` 內，包含智能體工作流與大模型調用邏輯
- 支持從 `.env` 文件讀取環境變量，可參考 `.env.example`

## 目錄結構
```
server/
├── config/                # 數據庫連接配置
│   └── db.js
├── middlewares/           # 中間件
│   └── jwtauth.js
├── routes/                # 路由定義
│   ├── auth.js
│   ├── subscriptions.js
│   ├── agents.js
│   ├── agentPurchases.js
│   └── llm.js
├── services/              # 業務邏輯
│   ├── agentService.js
│   ├── purchaseService.js
│   ├── llmService.js
│   └── subsrciptionService.js
├── index.js               # 應用入口
├── package.json
└── .env.example           # 環境變量模板
```

## 快速開始
1. 進入此目錄執行 `npm install` 安裝依賴。
2. 將 `.env.example` 複製為 `.env`，填寫資料庫及 API 配置。
3. 執行 `npm start` 啟動服務，默認監聽 3000 端口。

## 常用接口
- `POST /api/auth/register` 用戶註冊
- `POST /api/auth/login` 用戶登入並獲取 JWT
- `GET /api/subscriptions/plans` 取得訂閱套餐
- `POST /api/subscriptions/subscribe` 訂閱指定套餐
- `GET /api/agents` 查詢可用智能體
- `POST /api/agents/:id/run` 運行智能體工作流
