const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 代理目标，指向你的后端服务
        changeOrigin: true, // 允许跨域
        // 可选：如果你的后端 API 路径没有 /api 前缀，可以重写路径
        // pathRewrite: { '^/api': '' }, 
      },
    },
  },
});