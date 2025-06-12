<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="app-layout">
    <aside class="app-sidebar">
      <div class="sidebar-logo">
        <img src="../assets/menu.svg" alt="Logo" class="sidebar-logo-img" />
      </div>

      <div class="sidebar-buttons" v-if="showSidebar">
        <ul class="sidebar-menu">
          <img src="../assets/DashboardFilled.svg" alt="Logo" class="icon-left" />
          <li
            :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentInsightSidebarNav[0] === '仪表盘' }]"
            @click="handleSidebarClick({ key: '仪表盘' })"
          >
            仪表盘
          </li>
          <li
            :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentInsightSidebarNav[0] === '智能洞察' }]"
            @click="handleSidebarClick({ key: '智能洞察' })"
          >
            智能洞察
          </li>
          <li
            :class="['sidebar-menu-item', { 'sidebar-menu-item-selected': currentInsightSidebarNav[0] === '洞察历史' }]"
            @click="handleSidebarClick({ key: '洞察历史' })"
          >
            洞察历史
          </li>
        </ul>
      </div>
      <div v-else class="other-sidebar-content"></div>
    </aside>

    <div class="main-content-wrapper">
      <header class="content-top-bar">
        <div class="main-header-left-section">
          <div class="main-content-logo">
            <img src="../assets/logo_inverse.png" alt="wensu_Logo" class="main-header-logo-img" />
          </div>
        </div>

        <div class="main-header-right-section">
          <div class="top-nav-buttons">
            <div
              v-for="item in topNavItems"
              :key="item.key"
              :class="['nav-button', { 'nav-button-active': currentTopNav[0] === item.key }]"
              @click="handleTopNavClick(item)"
            >
              {{ item.label }}
            </div>
          </div>

          <div class="header-right-icons">
            <button class="header-icon-btn" title="灵感">
              <img src="../assets/inspiration.svg" alt="灵感" class="custom-header-icon-svg" />
            </button>
            <button class="header-icon-btn" title="搜索">
              <img src="../assets/search.svg" alt="搜索" class="custom-header-icon-svg" />
            </button>
            <button class="header-icon-btn" title="头像">
              <img src="../assets/avatar.svg" alt="头像" class="custom-header-icon-svg" />
            </button>
          </div>
        </div>
      </header>

      <main class="main-content-area">
        <router-view :selectedInsightNav="currentInsightSidebarNav[0]" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const topNavItems = ref([
  { key: 'insight-engine', label: '洞察引擎', path: '/main/insight-engine' },
  { key: 'narrative-engine', label: '叙事生成引擎', path: '/main/narrative-engine' },
  { key: 'ip-activation-engine', label: 'IP活化引擎', path: '/main/ip-activation-engine' },
  { key: 'knowledge-base', label: '知识库', path: '/main/knowledge-base' },
]);

const currentTopNav = ref(['insight-engine']); // 默认选中洞察引擎
const currentInsightSidebarNav = ref(['仪表盘']); // 洞察引擎内部侧边栏的选中状态

// 根据路由变化更新顶部导航的选中状态
watch(route, (newRoute) => {
  const topNavKey = newRoute.meta?.topNav;
  if (topNavKey) {
    currentTopNav.value = [topNavKey];
  } else {
    currentTopNav.value = []; // 如果没有匹配的顶部导航，则不选中
  }
  // 当切换到非洞察引擎页面时，重置侧边栏选中状态
  if (topNavKey !== 'insight-engine') {
    currentInsightSidebarNav.value = [];
  } else {
    if (!currentInsightSidebarNav.value.length) {
      currentInsightSidebarNav.value = ['仪表盘']; // 确保内部侧边栏选中仪表盘
    }
  }
}, { immediate: true });

// 顶部导航栏点击事件
const handleTopNavClick = (item) => {
  const key = item.key;
  if (key === 'insight-engine') {
    router.push(item.path);
    currentInsightSidebarNav.value = ['仪表盘']; // 确保内部侧边栏选中仪表盘
  } else {
    router.push(item.path);
    currentInsightSidebarNav.value = []; // 切换到非洞察引擎时，清空侧边栏选中
  }
};

// 侧边栏点击事件 (仅在洞察引擎激活时有效)
const handleSidebarClick = (e) => {
  const key = e.key;
  currentInsightSidebarNav.value = [key]; // 更新洞察引擎内部的选中状态
};

// 计算属性：判断是否显示侧边栏
const showSidebar = computed(() => {
  return currentTopNav.value.includes('insight-engine');
});
</script>

<style scoped>
/* 整个应用布局容器 */
.app-layout {
  display: flex;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #f0f2f5;
}

/* 左侧全高侧边栏 */
.app-sidebar {
  width: 250px; /* 固定宽度，不再动态变化 */
  background-color: #fff;
  /* box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05); */
  padding-top: 20px;
  flex-shrink: 0;
}

.sidebar-logo {
  height: 64px;
  display: flex;
  justify-content: flex-start; /* 左对齐 */
  align-items: center;
  margin-bottom: 20px;
  padding-left: 30px;
  border-bottom: 1px solid #f0f0f0;
  /* 移除 cursor: pointer; 和 @click 事件，因为它不再是触发器 */
}

.sidebar-logo-img {
  max-width: 20%;
  max-height: 80%;
  object-fit: contain;
  /* 移除与折叠相关的样式 */
}

/* 侧边栏菜单容器 */
.sidebar-buttons {
  background-color: transparent;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: transparent;
}

/* 侧边栏菜单项 */
.sidebar-menu-item {
  margin: 0 16px 8px;
  border-radius: 16px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 500;
  height: 48px;
  line-height: 48px;
  color: #333;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  display: flex;
  align-items: center;
}

/* 选中状态的菜单项 */
.sidebar-menu-item-selected {
  background-color: var(--theme-color-60);
  color: #fff;
  font-weight: 100px;
  box-shadow: var(--box-shadow);
}

/* 其他非洞察引擎的侧边栏内容占位符 */
.other-sidebar-content {
  padding: 20px;
  color: #fff;
  text-align: center;
}

/* 右侧主内容区域的容器 */
.main-content-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

/* 右侧内容的顶部条 */
.content-top-bar {
  height: 64px;
  display: flex;
  /* 关键修改：不再使用 space-between，而是依靠 margin-left: auto */
  /* justify-content: space-between; */
  align-items: center;
  padding: 0 24px;
  background-color: #f0f2f5;
}

/* 顶部条左侧的 Logo 容器 */
.main-header-left-section {
  display: flex;
  align-items: center;
  /* 没有 margin-right: auto，所以它会保持在左侧 */
}

.main-content-logo {
  height: 40px; /* 示例高度，确保它在顶部条中垂直居中和美观 */
  display: flex; /* 确保图片能被 Flex 居中 */
  align-items: center; /* 垂直居中图片 */
  justify-content: flex-start; /* 或者 center，取决于你想让Logo在容器中靠左还是居中 */
  /* 如果Logo需要与顶部导航按钮有间距，可以在这里加 margin-right */
  margin-right: 40px; /* 示例：Logo和顶部导航按钮组之间的间距 */
}

/* Logo 图片的样式 */
.main-header-logo-img {
  max-height: 100%; /* 确保图片不超过其父容器的高度 */
  width: auto; /* 保持图片原始宽高比 */
  object-fit: contain; /* 如果图片尺寸与容器不符，确保完整显示 */
  /* 可以为图片设置固定宽度，例如： */
  /* width: 120px; */
  /* height: 30px; */
}

/* 顶部条右侧的导航按钮组和图标容器 */
.main-header-right-section {
  display: flex;
  align-items: center;
  margin-left: auto; /* 关键：这会将整个右侧容器推到最右边 */
}

/* 顶部导航按钮组容器样式 */
.top-nav-buttons {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 999px;
  padding: 4px;
  max-width: 600px;
  justify-content: flex-start;
}

.nav-button {
  flex: 1;
  padding: 8px 20px;
  border-radius: 999px;
  text-align: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #1B5192;
  transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
  white-space: nowrap;
}

.nav-button-active {
  background-color: #CDE0F6;
  color: #1B5192;
  font-weight: bold;
}

/* 头部右侧图标区域 */
.header-right-icons {
  display: flex;
  align-items: center;
  margin-left: 10px; /* 这会是 top-nav-buttons 和 header-right-icons 之间的间距 */
}

.header-icon-btn {
  background-color: white; /* 白色背景 */
  border: none; /* 移除边框 */
  border-radius: 50%; /* 圆形剪裁 */
  cursor: pointer;
  width: 40px; /* 固定宽度，与高度相同以形成圆形 */
  height: 40px; /* 固定高度 */
  display: flex; /* 使用 Flexbox 布局 */
  justify-content: center; /* 水平居中 SVG */
  align-items: center; /* 垂直居中 SVG */
  margin-left: 15px; /* 按钮之间的间距 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 柔和的阴影，增加立体感 */
  transition: background-color 0.3s ease, box-shadow 0.3s ease; /* 过渡效果 */
}

.header-icon-btn:hover {
  background-color: #CDE0F6; /* 鼠标悬停时的浅蓝色背景 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* 悬停时更明显的阴影 */
}

/* 自定义 SVG 图标的样式 */
.custom-header-icon-svg {
  width: 30px; /* SVG 图标在按钮内部的大小 */
  height: 30px;
  /* 如果你的 SVG 文件内部的 fill/stroke 属性是 currentColor，
     那么你可以通过设置父元素（.header-icon-btn）的 color 属性来改变 SVG 的颜色。
     否则，你需要在这里直接设置 fill/stroke 属性。 */
  fill: #555; /* 默认图标颜色，可以根据你的 SVG 实际颜色调整 */
  transition: fill 0.3s ease; /* SVG 颜色变化的过渡效果 */
}

/* 鼠标悬停时改变 SVG 图标的颜色 */
.header-icon-btn:hover .custom-header-icon-svg {
  fill: #1890ff; /* 悬停时图标变为蓝色 */
}

/* 主内容区域 */
.main-content-area {
  flex-grow: 1;
  margin: 0 24px 24px;
  min-height: calc(100vh - 64px - 24px - 24px);
  background-color: #f0f2f5;
  border-radius: 8px;
  overflow: auto;
}
</style>