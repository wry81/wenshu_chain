<template>
  <div class="login-container">
    <a-card title="文枢链" style="width: 400px">
      <h2>AI语义驱动文档设计云平台</h2>
      
      <a-form layout="vertical">
        <a-form-item label="用户名">
          <a-input v-model:value="username" placeholder="请输入用户名"/>
        </a-form-item>
        
        <a-form-item label="密码">
          <a-input-password v-model:value="password" placeholder="请输入密码"/>
        </a-form-item>
        
        <a-form-item>
          <a-checkbox v-model:checked="remember">记住密码</a-checkbox>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" block @click="handleLogin">登录</a-button>
        </a-form-item>
      </a-form>
      
      <div class="footer">
        <a-button type="link">注册</a-button>
        <p>版权所有XXX</p>
      </div>
    </a-card>
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
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
}

.footer {
  text-align: center;
  margin-top: 16px;
}
</style>