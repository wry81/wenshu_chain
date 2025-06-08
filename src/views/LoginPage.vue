<template>
  <div class="login-container">
    <div class="login-left">
      <div class="logo-placeholder"></div>
      <h1>文枢链</h1>
      <p class="subtitle">AI语义驱动文档设计云平台</p>
      <p class="copyright">版权所有XXX</p>
    </div>
    <div class="login-right">
      <a-card class="login-card" bordered="false" :body-style="{ padding: '20px' }">
        <div class="login-form">
          <h2 class="login-title">登录</h2>
          <a-form
            layout="horizontal"
            label-align="left"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
          >
            <a-form-item label="用户名">
              <a-input v-model:value="username" placeholder="请输入用户名"/>
            </a-form-item>
            <a-form-item label="密码">
              <a-input-password v-model:value="password" placeholder="请输入密码"/>
            </a-form-item>
            <a-form-item>
              <a-checkbox v-model:checked="remember">记住密码</a-checkbox>
            </a-form-item>
          </a-form>
          <div class="footer">
            <a-button type="primary" block @click="handleLogin">登录</a-button>
            <a-button class="register-button" block>注册</a-button>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      remember: false
    }
  },
  methods: {
    handleLogin() {
      // 简单跳转到主页面，实际项目这里会有API调用
      this.$router.push('/main')
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
}
.login-left {
  flex: 0.8;
  /* horizontal padding to offset from left */
  padding: 350px 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  background-color: #f5f7fa;
}
.logo-placeholder {
  width: 194px;
  height: 194px;
  background-color: #CDE0F6;
  border-radius: 23px;
  margin-bottom: 24px;
}
.login-left h1 {
  font-size: 40px;
  margin: 0 0 8px;
  font-weight: 700;
}
.login-left .subtitle {
  font-size: 14px;
  margin: 0 0 16px;
  color: #666;
}
.login-left .copyright {
  margin-top: auto;
  font-size: 12px;
  color: #999;
}
.login-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e0e0e0;
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
}
.login-card {
  width: 500px;
  border-radius: 8px;
  background: #fff;
}
.login-title {
  margin: 0 0 24px;
  font-size: 30px;
  font-weight: 600;
}
.footer {
  font-size: 20px;
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.register-button {
  border: 1px solid #1249FF;
  color: #1249FF;
}
.login-form {
  width: 100%;
  padding: 40px;
  box-sizing: border-box;
}

.login-form .ant-input,
.login-form .ant-input-affix-wrapper {
  border-radius: 999px;
  height: 40px;
}

.footer .ant-btn {
  height: 48px;
  line-height: 40px;
  font-size: 16px;
  border-radius: 20px;
}

.footer .register-button {
  height: 48px;
  line-height: 40px;
}

.login-form .ant-form-item-label > label {
  line-height: 40px;
  font-weight: 500;
}
</style>
