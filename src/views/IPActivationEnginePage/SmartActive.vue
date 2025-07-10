<template>
  <div class="smart-insight-page">
    <div class="page-header">
      <div class="header-text">
        <h2 class="page-title">
          已购买智能体
        </h2>
        <div class="page-description">
          选择一个智能体，开始工作或管理
        </div>
      </div>
      <div class="sort-filter-group">
        <button class="filter-btn">
          切换视图
        </button>
        <div class="sort-dropdown">
          <button class="sort-btn">
            排序: 最近更新 <span class="arrow-down" />
          </button>
          <div class="sort-options">
            <div class="sort-option">
              最近更新
            </div>
            <div class="sort-option">
              最近使用
            </div>
            <div class="sort-option">
              创建时间升序
            </div>
          </div>
        </div>
        <!-- <button class="search-btn"><img src="../../assets/search.svg" alt="搜索" /></button> -->
        <div class="search-container">
          <input
            type="text"
            placeholder="搜索..."
            class="search-input"
          >
          <button class="search-btn">
            <img
              src="../../assets/search.svg"
              alt="搜索"
            >
          </button>
        </div>
      </div>
    </div>

    <div class="agent-grid">
      <div
        class="agent-card"
        @click="selectAgent(3)"
      >
        <img
          src="../../assets/bg2.png"
          alt="智能体图片"
          class="agent-card-image"
        >
        <h3 class="agent-name">
          文旅IP多模态创作
        </h3>
        <p class="agent-description">
          融合图文问答、视觉原型、动态表情包及场景化延展的 IP 创作流程。
        </p>
      </div>

      <div
        class="agent-card"
        @click="selectAgent('agent2')"
      >
        <img
          src="../../assets/bg2.png"
          alt="智能体图片"
          class="agent-card-image"
        >
        <h3 class="agent-name">
          IP故事生成
        </h3>
        <p class="agent-description">
          基于角色设定自动生成引人入胜的IP故事线, 从世界观构建到情节发展, 为您的IP注入灵魂与记忆点。
        </p>
      </div>

      <div
        class="agent-card"
        @click="selectAgent('agent2')"
      >
        <img
          src="../../assets/bg2.png"
          alt="智能体图片"
          class="agent-card-image"
        >
        <h3 class="agent-name">
          IP形象动画化
        </h3>
        <p class="agent-description">
          将静态IP形象转化为生动动画, 自动生成表情动作与微交互, 让您的角色真正'活'起来, 提升用户情感连接。
        </p>
      </div>

      <div class="agent-card add-agent-card">
        <div class="add-icon-container">
          <div class="add-icon">
            +
          </div>
        </div>
        <h3 class="agent-name">
          添加智能体
        </h3>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IPActivationEnginePage',
  methods: {
    selectAgent(agentId) {
      // 当点击智能体卡片时，导航到智能体编辑页面
      this.$router.push(`/main/ip-activation-engine/smart-active/${agentId}/editor`);
    }
  },
};
</script>

<style scoped>
.smart-insight-page {
  padding: 20px;
  background-color: var(--color-background); /* 背景色 FDF8F8 */
  color: var(--color-text-body); /* 默认文字颜色 3B1D1D */
  border-radius: var(--border-radius-large);
  /* box-shadow: var(--box-shadow-soft); */
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  flex-wrap: wrap; /* 允许换行 */
  align-items: center;
  margin-bottom: 20px;
  gap: 10px; /* 元素间距 */
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.page-title {
  font-size: var(--font-size-h2); /* H2 / 标题 / 26px */
  font-weight: 600;
  color: var(--color-title); /* 标题颜色 1F0C0C */
  margin-right: 0; /* 与描述的间距 */
}

.page-description {
  font-size: var(--font-size-body); /* 正文 / 14px */
  color: var(--theme-color-60); /* 说明文字 AD8888 */
  flex-grow: 0; /* 占据尽可能多的空间 */
}

.sort-filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto; /* 推到最右边 */
}

.filter-btn,
.sort-btn {
  padding: 8px 15px;
  border: 1px solid var(--color-divider); /* 描边颜色 E9E9E9 */
  border-radius: 999px;
  background-color: var(--white-color); /* 白色背景 */
  color: var(--color-text-body);
  cursor: pointer;
  font-size: var(--font-size-body);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-btn:hover,
.sort-btn:hover {
  background-color: var(--color-neutral-light); /* 悬停背景色 F3F3F3 */
  border-color: var(--theme-color-40); /* 悬停描边色 F8D6D6 */
}

.sort-dropdown {
  position: relative;
}

.sort-options {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--white-color);
  border: 1px solid var(--color-divider);
  border-radius: var(--border-radius-medium);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  z-index: 10;
  display: none; /* 默认隐藏 */
}

.sort-dropdown:hover .sort-options {
  display: block; /* 悬停时显示 */
}

.sort-option {
  padding: 8px 15px;
  cursor: pointer;
  font-size: var(--font-size-body);
  color: var(--color-text-body);
}

.sort-option:hover {
  background-color: var(--color-neutral-light);
}

.arrow-down {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid var(--color-text-body);
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: var(--border-radius-small);
  transition: background-color 0.3s ease;
}
.search-container {
  display: flex;
  align-items: center;
  background-color: var(--white-color);
  border: 1px solid var(--color-divider);
  border-radius: 999px;
  padding: 0 10px;
  flex-grow: 1;
  max-width: 300px;
  margin-left: auto;
}

.search-input {
  border: none;
  outline: none;
  padding: 8px 0;
  flex-grow: 1;
  background: transparent;
  font-size: var(--font-size-body);
}

.search-input::placeholder {
  color: var(--color-neutral-mid-gray);
}

.search-btn:hover {
  background-color: var(--color-neutral-light);
}

.search-btn img {
  width: 20px;
  height: 20px;
}

.agent-grid {
  display: flex;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* 响应式卡片布局 */
  gap: 20px;
  flex-wrap: wrap; /* 允许换行 */
  /* flex-grow: 1; 让网格占据剩余空间 */
}

.agent-card {
  background-color: var(--white-color); /* 卡片背景色 */
  border-radius: var(--border-radius-large);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 300px;
  width: 250px;
  flex-shrink: 0;
}

.agent-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.agent-card-image {
  width: 100%;
  max-width: 300px; /* 控制图片大小 */
  height: 200px;
  margin-bottom: 15px;
  border-radius: var(--border-radius-medium);
}

/* 占位图片，你需要准备 agent-card-image1.png, agent-card-image2.png 等图片 */
/* 这里只是一个占位符，实际图片可能需要你去设计或找到 */
.agent-card:nth-child(1) .agent-card-image {
  background-color: #f7e6e6; /* 示例占位色 */
  content: url('../../assets/bg2.png'); /* 使用你提供的图片作为示例 */
  object-fit: cover;
  height: 200px;
}
.agent-card:nth-child(2) .agent-card-image {
  background-color: #e6f7e6; /* 示例占位色 */
  content: url('../../assets/bg2.png'); /* 使用你提供的图片作为示例 */
  object-fit: cover;
  height: 200px;
}

.agent-name {
  font-size: var(--font-size-h3); /* H3 / 小标题 / 18px */
  font-weight: 900;
  color: #000; /* 标题颜色 1F0C0C */
  margin-bottom: 0;
  text-align: left;
}

.agent-description {
  font-size: var(--font-size-tertiary); /* 正文 / 14px */
  font-weight: 400;
  color: var(--color-text-body); /* 说明文字 AD8888 */
  line-height: 1.5;
  margin-bottom: 10;
  text-align: left;
}

.add-agent-card {
  border: 2px dashed var(--theme-color-60); /* 虚线边框 E9E9E9 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 250px; /* 确保高度与其他卡片大致相同 */
}
.add-icon-container {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--theme-color-20); /* Light red background */
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
}

.add-icon {
  font-size: 60px;
  font-weight: 350;
  color: var(--theme-color-primary); /* 中灰 D0D0D0 */
  margin-bottom: 10px;
}

.add-agent-card .agent-name {
  color: var(--color-neutral-mid-gray);
}
</style>