<template>
  <div class="login-container">
    <div class="login-left">
      <div class="logo-wrapper">
        <img src="../assets/logo.png" alt="文枢链 Logo" class="app-logo" />
      </div>
      <h1>文枢链</h1>
      <p class="subtitle">AI语义驱动文档设计云平台</p>
      <p class="copyright">‌©版权所有：嘉善文枢智创科技有限公司 2025</p>
    </div>
    <div class="login-right">
      <div class="login-card">
        <div class="login-form">
          <h2 class="login-title">登录</h2>
          <form class="custom-form">
            <div class="form-item">
              <label for="email" class="form-label">用户名/邮箱</label>
              <div class="form-control-wrapper">
                <input type="email" id="email" v-model="email" placeholder="请输入邮箱" class="custom-input" />
              </div>
            </div>
            <div class="form-item">
              <label for="password" class="form-label">密码</label>
              <div class="form-control-wrapper">
                <input type="password" id="password" v-model="password" placeholder="请输入密码" class="custom-input" />
              </div>
            </div>
            <div class="form-item">
              <label for="inviteCode" class="form-label">验证码</label>
              <div class="form-control-wrapper">
                <input type="text" id="inviteCode" v-model="inviteCode" placeholder="请输入邀请码" class="custom-input" />
              </div>
            </div>
            <!-- <div class="form-item no-label">
              <div class="form-control-wrapper checkbox-wrapper terms-checkbox">
                <input type="checkbox" id="agreeTerms" v-model="agreeTerms" class="custom-checkbox" />
                <label for="agreeTerms" class="checkbox-label">阅读并同意<a href="#" class="terms-link">用户隐私协议条款</a></label>
              </div>
            </div> -->
          </form>
          <div class="footer">
            <button type="button" class="custom-button primary-button" @click="handleLogin">登录</button>
            <button type="button" class="custom-button register-button" @click="goToRegister">注册</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      email: '',      // 将作为 username 或 email 发送
      password: '',
      inviteCode: '', // 登录时不需要验证码，但保留以匹配UI
    };
  },
  methods: {
    // 方法名从 handleRegister 修改为 handleLogin，更符合其功能
    async handleLogin() {
      // 检查用户是否输入了内容
      if (!this.email || !this.password) {
        alert('请输入用户名/邮箱和密码！');
        return;
      }

      // 使用 try...catch 结构来处理成功和失败的情况
      try {
        // 发送 POST 请求到后端的登录接口
        const response = await axios.post('/api/auth/login', {
          username: this.email, // 将输入框的内容作为 username 发送
          password: this.password
        });

        // 检查后端是否成功返回了 token
        if (response.data.token) {
          // 登录成功，将 token 存储到浏览器的 localStorage
          localStorage.setItem('token', response.data.token);
          
          alert('登录成功！');
          
          // 跳转到主应用页面
          this.$router.push('/main');
        } else {
          // 如果后端没有返回 token，也视为失败
          throw new Error('未能从服务器获取Token，请稍后再试。');
        }
      } catch (error) {
        // 如果请求失败（如网络错误、服务器返回错误状态码）
        console.error('登录失败:', error.response ? error.response.data : error.message);
        
        // 从后端返回的错误信息中提取 message 字段显示给用户
        const errorMessage = error.response?.data?.message || '登录时发生未知错误';
        alert(`登录失败: ${errorMessage}`);
      }
    },
    goToRegister() {
      // 跳转到注册页面的方法保持不变
      this.$router.push('/register');
    }
  }
};
</script>

<style scoped>
/* 容器布局 */
.login-container {
  display: flex;
  height: 100vh;
}

/* 左侧内容区 */
.login-left {
  flex: 1;
  padding: 0 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  background: linear-gradient(-33deg, #D33A3A, #87271E);
  position: relative;
}

/* Logo 容器和图片样式 */
.logo-wrapper {
  width: 194px;
  height: 194px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-radius: 23px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.app-logo {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  display: block;
}

.login-left h1 {
  font-size: 40px;
  margin: 0 0 8px;
  font-weight: 700;
  color: #fff;
}

.login-left .subtitle {
  font-size: 14px;
  margin: 0;
  color: #fff;
}

.login-left .copyright {
  position: absolute;
  bottom: 40px; /* 调整为 20px */
  left: 100px;
  font-size: 12px;
  color: #fff;
}

/* 右侧登录/注册卡片区 - 修改此处 */
.login-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff; /* 将背景色改为白色 */
  border-top-left-radius: 16px; /* 添加圆角 */
  border-bottom-left-radius: 16px; /* 添加圆角 */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.354); /* 添加柔和阴影 */
  /* padding-left 移除，因为登录卡片现在是居中在 login-right 中 */
  /* 可以通过负 margin 让其稍微重叠，但这里先不加，保持结构清晰 */
  margin-left: -16px; /* 尝试负 margin 使圆角区域稍微重叠 */
  z-index: 1; /* 确保它在左侧背景之上 */
}

/* 登录/注册卡片样式 - 修改此处 */
.login-card {
  width: 450px;
  background: transparent; /* 将背景设为透明，让父容器的背景和圆角生效 */
  border-radius: 0; /* 移除 login-card 自身的圆角 */
  box-shadow: none; /* 移除 login-card 自身的阴影 */
  border: none;
  padding: 20px; /* 适当内边距，防止内容贴边 */
  box-sizing: border-box; /* 确保 padding 不会影响 width */
}

/* 登录表单容器 */
.login-form {
  width: 100%;
  padding: 0px;
  box-sizing: border-box;
}

.login-title {
  margin: 0 0 24px;
  font-size: 30px;
  font-weight: 600;
  text-align: left;
  color: #333;
}

/* 自定义表单项布局 */
.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.form-item.no-label {
  justify-content: flex-start;
  margin-bottom: 0;
  margin-top: -10px;
}

.form-label {
  flex-shrink: 0;
  width: 100px;
  text-align: left;
  padding-right: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  line-height: 40px;
}

.form-control-wrapper {
  flex-grow: 1;
  position: relative;
}

/* 自定义输入框样式 */
.custom-input {
  width: 100%;
  height: 40px;
  padding: 8px 16px;
  border: none;
  border-bottom: 1px solid #d9d9d9;
  border-radius: 0;
  font-size: 14px;
  color: #333;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
  background-color: transparent;
}

.custom-input:focus {
  outline: none;
  border-color: #1249FF;
  box-shadow: none;
}

.custom-input::placeholder {
  color: #bfbfbf;
}

/* 记住密码复选框样式 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}

.custom-checkbox {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  background-color: #fff;
  transition: all 0.2s;
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.custom-checkbox:checked {
  background-color: #D33A3A;
  border-color: #D33A3A;
}

.custom-checkbox:checked::after {
  content: '';
  position: relative;
  width: 8px;
  height: 4px;
  border: 2px solid #fff;
  border-top: none;
  border-right: none;
  transform: rotate(-45deg) translate(2px, 3px);
  display: block;
}

.checkbox-label {
  font-size: 14px;
  color: #555;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
}

.terms-link {
  color: #D33A3A;
  text-decoration: none;
  margin-left: 5px;
}

.terms-link:hover {
  text-decoration: underline;
}

/* 底部按钮区 */
.footer {
  margin-top: 50px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 自定义按钮样式 */
.custom-button {
  width: 100%;
  height: 48px;
  padding: 0 15px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.primary-button {
  background-color: #87271E;
  color: #fff;
  border: 1px solid #87271E;
}

.primary-button:hover {
  background-color: #a02e23;
  border-color: #a02e23;
}

.register-button {
  background-color: #fff;
  color: #87271E;
  border: 1px solid #87271E;
}

.register-button:hover {
  background-color: #f7e0e0;
  color: #87271E;
  border-color: #87271E;
}
</style>