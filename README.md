# wenshu_chain

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### 项目结构
```
wenshu_chain/
├── public/
│   └── index.html          # 主HTML文件
├── src/
│   ├── assets/             # 静态资源
│   ├── components/         # 可复用组件
│   ├── views/              # 页面组件
│   │   ├── Login.vue       # 登录页面
│   │   └── Main.vue        # 主页面
│   ├── App.vue             # 根组件
│   ├── main.js             # 应用入口
│   └── router/index.js     # 路由配置
└── package.json
```

## Backend server

A basic Express server under `server/` provides registration and login APIs.

### Setup
```bash
cd server
npm install
cp .env.example .env  # then edit database credentials
npm start
```
The server listens on port 3000 by default.

### Endpoints
- `POST /api/register` – register a new user using JSON `{username, password, email?, phone?}`
- `POST /api/login` – obtain a JWT token with `{username, password}`
