<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="main-layout">
    <header class="top-navbar">
      <div class="navbar-left">
        <img src="../assets/logo-with-text.png" alt="文枢链 Logo" class="navbar-logo" />
      </div>

      <div class="navbar-right-group">
        <nav class="navbar-center-buttons-container">
          <button
            :class="['top-nav-btn', { 'top-nav-btn-selected': currentTopNav === 'insight-engine' }]"
            @click="handleTopNavClick('insight-engine')"
          >
            洞察引擎
          </button>
          <button
            :class="['top-nav-btn', { 'top-nav-btn-selected': currentTopNav === 'narrative-engine' }]"
            @click="handleTopNavClick('narrative-engine')"
          >
            叙事生成引擎
          </button>
          <button
            :class="['top-nav-btn', { 'top-nav-btn-selected': currentTopNav === 'ip-activation-engine' }]"
            @click="handleTopNavClick('ip-activation-engine')"
          >
            IP活化引擎
          </button>
          <button
            :class="['top-nav-btn', { 'top-nav-btn-selected': currentTopNav === 'knowledge-base' }]"
            @click="handleTopNavClick('knowledge-base')"
          >
            知识库
          </button>
          <!-- <button
            :class="['top-nav-btn', { 'top-nav-btn-selected': currentTopNav === 'agent-test' }]"
            @click="handleTopNavClick('agent-test')"
          >
            Agent测试
          </button> -->
        </nav>
        <div class="navbar-right">
          <button class="top-nav-icon-btn">
            <img src="../assets/search.svg" alt="搜索" />
          </button>
          <button class="top-nav-icon-btn">
            <img src="../assets/avatar.svg" alt="用户" />
          </button>
        </div>
      </div>
    </header>

    <div class="content-wrapper">
      <aside class="sidebar" :class="{ 'sidebar-collapsed': !showSidebar }">
        <div class="sidebar-header" :class="{ 'sidebar-header-collapsed': !showSidebar }">
          <button class="hamburger-menu-btn" @click="toggleSidebar">
            <img src="../assets/menu.svg" alt="菜单" />
          </button>
          </div>

        <ul class="sidebar-menu">
          <template v-if="currentTopNav === 'insight-engine'">
            <li
              :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentInsightSidebarNav === '仪表盘' }]"
              @click="handleSidebarClick('仪表盘', '/main/insight-engine/dashboard')"
              data-selected="仪表盘"
            >
              <img src="../assets/DashboardFilled.svg" alt="仪表盘" class="icon-left" />
              <span v-if="showSidebar">仪表盘</span>
            </li>
            <li
              :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentInsightSidebarNav === '智能洞察' }]"
              @click="handleSidebarClick('智能洞察', '/main/insight-engine/smart-insight')"
              data-selected="智能洞察"
            >
              <img src="../assets/fire.svg" alt="智能洞察" class="icon-left" />
              <span v-if="showSidebar">智能洞察</span>
            </li>
            <li
              :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentInsightSidebarNav === '洞察历史' }]"
              @click="handleSidebarClick('洞察历史', '/main/insight-engine/history')"
              data-selected="洞察历史"
            >
              <img src="../assets/HistoryOutlined.svg" alt="洞察历史" class="icon-left" />
              <span v-if="showSidebar">洞察历史</span>
            </li>
          </template>

          <template v-else-if="currentTopNav === 'narrative-engine'">
            <li
              :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentNarrativeSidebarNav === '智能生成' }]"
              @click="handleNarrativeSidebarClick('智能生成', '/main/narrative-engine/smart-generation')"
              data-selected="智能生成"
            >
              <img src="../assets/fire.svg" alt="智能生成" class="icon-left" />
              <span v-if="showSidebar">智能生成</span>
            </li>
            <li
              :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentNarrativeSidebarNav === '生成历史' }]"
              @click="handleNarrativeSidebarClick('生成历史', '/main/narrative-engine/generation-history')"
              data-selected="生成历史"
            >
              <img src="../assets/HistoryOutlined.svg" alt="生成历史" class="icon-left" />
              <span v-if="showSidebar">生成历史</span>
            </li>
          </template>

          <template v-else-if="currentTopNav === 'ip-activation-engine'">
            <li
              :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentNarrativeSidebarNav === '智能活化' }]"
              @click="handleNarrativeSidebarClick('智能活化', '/main/ip-activation-engine/smart-active')"
              data-selected="智能活化"
            >
              <img src="../assets/fire.svg" alt="智能活化" class="icon-left" />
              <span v-if="showSidebar">智能活化</span>
            </li>
            <li
              :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentNarrativeSidebarNav === '活化历史' }]"
              @click="handleNarrativeSidebarClick('活化历史', '/main/ip-activation-engine/active-history')"
              data-selected="活化历史"
            >
              <img src="../assets/HistoryOutlined.svg" alt="活化历史" class="icon-left" />
              <span v-if="showSidebar">活化历史</span>
            </li>
          </template>
        </ul>
      </aside>

      <main class="main-content">
        <router-view @toggle-sidebar="handleToggleSidebar" />
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainLayout',
  data() {
    return {
      showSidebar: true, // 控制侧边栏展开/折叠的状态，默认为展开
      currentTopNav: 'insight-engine',
      currentInsightSidebarNav: '仪表盘',
      currentNarrativeSidebarNav: '智能生成' //默认在侧边栏选中智能生成
    };
  },
  watch: {
    '$route.path': {
      immediate: true,
      handler(newPath) {
        if (newPath.startsWith('/main/insight-engine')) {
          this.currentTopNav = 'insight-engine';
          if (newPath.includes('dashboard')) {
            this.currentInsightSidebarNav = '仪表盘';
            this.showSidebar = true; // 确保进入仪表盘时侧边栏展开
          } else if (newPath.includes('smart-insight')) {
            // 如果路径包含 'editor' (即 NodeEditRedbook 页面)，则不展开侧边栏
            if (!newPath.includes('/editor')) {
              this.showSidebar = true; // 确保进入智能洞察列表页时侧边栏展开
            }
            this.currentInsightSidebarNav = '智能洞察';
          } else if (newPath.includes('history')) {
            this.currentInsightSidebarNav = '洞察历史';
            this.showSidebar = true; // 确保进入洞察历史时侧边栏展开
          }
        } else if (newPath.startsWith('/main/narrative-engine')) {
          this.currentTopNav = 'narrative-engine';
          this.showSidebar = true;
          if (newPath.includes('smart-generation')) {
            this.currentNarrativeSidebarNav = '智能生成';
          } else if (newPath.includes('generation-history')) {
            this.currentNarrativeSidebarNav = '生成历史';
          }
        } else if (newPath.startsWith('/main/ip-activation-engine')) {
          this.currentTopNav = 'ip-activation-engine';
          this.showSidebar = true;
          if (newPath.includes('smart-active')) {
            this.currentNarrativeSidebarNav = '智能活化';
          } else if (newPath.includes('active-history')) {
            this.currentNarrativeSidebarNav = '活化历史';
          }
        } else if (newPath.startsWith('/main/knowledge-base')) {
          this.currentTopNav = 'knowledge-base';
          this.showSidebar = true;
        } 
        //   else if (newPath.startsWith('/main/agent-test')) {
        //   this.currentTopNav = 'agent-test'; 
        //   this.showSidebar = false;
        // } 
        else {
          this.currentTopNav = '';
          this.showSidebar = true;
        }
      },
    },
  },
  methods: {
    handleNarrativeSidebarClick(sidebarKey, routePath) {
      this.currentNarrativeSidebarNav = sidebarKey;
      this.$router.push(routePath);
    },
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    // 新增方法：处理子组件发出的折叠侧边栏事件
    handleToggleSidebar(state) {
      this.showSidebar = state;
    },
    handleTopNavClick(navKey) {
      this.currentTopNav = navKey;
      // 点击顶部导航时，默认展开侧边栏 (如果需要)
      this.showSidebar = true;
      if (navKey === 'insight-engine') {
        this.currentInsightSidebarNav = '仪表盘';
        this.$router.push('/main/insight-engine');
      } else if (navKey === 'narrative-engine') {
        this.currentNarrativeSidebarNav = '智能生成'; 
        this.$router.push('/main/narrative-engine');
      } else if (navKey === 'ip-activation-engine') {
        this.$router.push('/main/ip-activation-engine');
      } else if (navKey === 'knowledge-base') {
        this.$router.push('/main/knowledge-base');
      }
      // else if (navKey === 'agent-test') {
      //   this.$router.push('/main/agent-test/1'); // 默认跳转到 agentId 为 1 的测试页
      // }
    },
    handleSidebarClick(sidebarKey, routePath) {
      this.currentInsightSidebarNav = sidebarKey;
      // 只有当路由路径不是编辑页面时，才在点击侧边栏时确保侧边栏展开
      // 编辑页面会自行控制侧边栏的折叠/展开
      if (!routePath.includes('/editor')) {
        this.showSidebar = true;
      }
      this.$router.push(routePath);
    },
  },
};
</script>

<style scoped>
/* 全局布局 */
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-image: url('../assets/background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 顶部导航栏 */
.top-navbar {
  height: 60px; /* 顶部导航高度 */
  background-color: #ffffff7a;
  display: flex;
  align-items: center;
  padding: 0 20px;
  z-index: 10;
  border-bottom: 2px solid var(--theme-color-40);
  flex-shrink: 0; /* 确保顶部导航栏不收缩 */
}

.navbar-left {
  display: flex;
  align-items: center;
}

.navbar-logo {
  height: 35px;
  margin-left: 30px;
  margin-right: 10px;
}

.navbar-right-group {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 20px;
}

.navbar-center-buttons-container {
  display: flex;
  align-items: center;
  background-color: var(--white-color);
  border-radius: var(--border-radius-large);
  padding: 5px 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  gap: 5px;
}

.top-nav-btn {
  padding: 8px 18px;
  height: auto;
  font-size: var(--font-size-body);
  font-weight: 500;
  border-radius: var(--border-radius-pill);
  color: var(--color-text-body);
  background-color: transparent;
}

.top-nav-btn-selected {
  background-color: var(--theme-color-primary);
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.top-nav-btn:hover {
  background-color: var(--theme-color-primary);
  color: #fff;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 内容区域布局 */
.content-wrapper {
  flex-grow: 1;
  display: flex;
  background-color: transparent;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 250px; /* 默认展开宽度 */
  background-color: var(--theme-color-40);
  box-shadow: var(--box-shadow-soft);
  transition: width 0.3s ease; /* 宽度过渡动画 */
  flex-shrink: 0; /* 防止侧边栏被压缩 */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-top: 20px; /* 顶部间距 */
  overflow-x: hidden; /* 隐藏超出部分，确保文字完全消失 */
}

/* 侧边栏折叠状态 */
.sidebar-collapsed {
  width: 80px; /* 折叠后的宽度，根据图片调整，让汉堡菜单和图标可见 */
  /* align-items: center; /* 在折叠时让内部项目居中，但如果header有特殊布局，可能要分开处理 */ 
}

/* 侧边栏头部 - 展开状态 */
.sidebar-header {
  padding: 0 20px 20px;
  display: flex;
  justify-content: flex-start; /* 汉堡菜单左对齐 */
  align-items: center;
  position: relative;
  transition: padding 0.3s ease; /* 过渡内边距 */
}

/* 侧边栏头部 - 折叠状态 */
.sidebar-header-collapsed {
  justify-content: center; /* 折叠时汉堡菜单居中 */
  padding: 0 0 20px; /* 移除左右padding */
}

.hamburger-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 25px; /* 展开时汉堡菜单的位置 */
  margin-top: 10px;
  border-radius: var(--border-radius-small);
  transition: background-color 0.3s ease, margin 0.3s ease; /* 增加 margin 过渡 */
}

.sidebar-header-collapsed .hamburger-menu-btn {
  margin-left: 0; /* 折叠时汉堡菜单居中，无需左边距 */
}

.hamburger-menu-btn:hover {
  background-color: var(--color-neutral-light);
}

.hamburger-menu-btn img {
  width: 24px;
  height: 24px;
}

/* 我移除了与 sidebar-logo-text 相关的样式，因为它在模板中已被移除 */
/* .sidebar-logo-text { ... } */
/* .sidebar-collapsed .sidebar-logo-text { ... } */
/* .sidebar-header-logo { ... } */
/* .sidebar-header-app-name { ... } */


.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
}

.sidebar-menu-item {
  display: flex; /* 使用 flexbox 对齐图标和文本 */
  align-items: center; /* 垂直居中对齐 */
  padding: 12px 30px; /* 增大点击区域和内边距 */
  cursor: pointer;
  color: var(--color-text-body);
  font-size: var(--font-size-body);
  font-weight: 500;
  transition: background-color 0.3s ease, color 0.3s ease, padding 0.3s ease, margin 0.3s ease; /* 增加 padding 和 margin 过渡 */
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden; /* 隐藏溢出内容，确保文字完全消失 */
  border-radius: 14px; /* 右侧圆角 */
  margin: 10px 20px; /* 留出右侧空间形成圆角效果 */
}

.sidebar-menu-item:hover {
  background-color: var(--theme-color-60);
  color: #fff;
}

/* 针对选中项的特定样式 */
.sidebar-menu-item-selected {
  /* 基础选中样式，会被下面的 data-selected 覆盖或补充 */
  background-color: var(--theme-color-60);
  color: #fff;
}
/* .sidebar-menu-item[data-selected="仪表盘"].sidebar-menu-item-selected {
  background-color: var(--theme-color-60); 
  color: #fff; 
}
.sidebar-menu-item[data-selected="智能洞察"].sidebar-menu-item-selected {
  background-color: var(--theme-color-60); 
  color: #fff; 
}
.sidebar-menu-item[data-selected="洞察历史"].sidebar-menu-item-selected {
  background-color: var(--theme-color-60); 
  color: #fff; 
} */

/* 侧边栏折叠状态下的菜单项 */
.sidebar-collapsed .sidebar-menu-item {
  justify-content: center; /* 图标居中 */
  padding: 12px 0; /* 调整内边距，使其更紧凑 */
  margin: 10px auto; /* 水平居中，并保持垂直间距 */
  width: 60px; /* 确保项目宽度与侧边栏宽度匹配，实现居中 */
}

/* 主内容区 */
.main-content {
  background-color: transparent;
  flex-grow: 1;
  padding: 20px; /* 主内容区内边距 */
  overflow-y: auto; /* 内容过多时滚动 */
}
</style>