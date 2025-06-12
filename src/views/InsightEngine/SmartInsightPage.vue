<template>
  <div class="smart-insight-page">
    <div class="page-header">
      <h2 class="page-title">已购买智能体</h2>
      <div class="page-description">选择一个智能体，开始工作或管理</div>
      <div class="sort-filter-group">
        <button class="filter-btn">筛选</button>
        <div class="sort-dropdown">
          <button class="sort-btn">排序: 最近更新 <span class="arrow-down"></span></button>
          <div class="sort-options">
            <div class="sort-option">最近更新</div>
            <div class="sort-option">最近使用</div>
            <div class="sort-option">创建时间升序</div>
          </div>
        </div>
        <button class="search-btn"><img src="../../assets/search.svg" alt="搜索" /></button>
      </div>
    </div>

    <div class="agent-grid">
      <div class="agent-card" @click="selectAgent('agent1')">
        <img src="../../assets/bg1.png" alt="智能体图片" class="agent-card-image" />
        <h3 class="agent-name">小红书/抖音文创趋势分析</h3>
        <p class="agent-description">
          实时追踪小红书、抖音等平台，洞悉文创领域的热点及趋势变化，辅助策略制定与创作。
        </p>
      </div>

      <div class="agent-card" @click="selectAgent('agent2')">
        <img src="../../assets/bg2.png" alt="智能体图片" class="agent-card-image" />
        <h3 class="agent-name">细分市场洞察</h3>
        <p class="agent-description">
          实时追踪细分市场，洞悉相关趋势变化，辅助策略制定与创作。
        </p>
      </div>

      <div class="agent-card" @click="selectAgent('agent3')">
        <img src="../../assets/bg2.png" alt="智能体图片" class="agent-card-image" />
        <h3 class="agent-name">场景活化潜力分析</h3>
        <p class="agent-description">
          实时追踪场景变化，洞悉相关趋势变化，辅助策略制定与创作。
        </p>
      </div>

      <div class="agent-card" @click="selectAgent('agent4')">
        <img src="../../assets/bg2.png" alt="智能体图片" class="agent-card-image" />
        <h3 class="agent-name">文化内涵深度解读</h3>
        <p class="agent-description">
          实时追踪文化变化，洞悉相关趋势变化，辅助策略制定与创作。
        </p>
      </div>

      <div class="agent-card add-agent-card">
        <div class="add-icon">+</div>
        <h3 class="agent-name">添加智能体</h3>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SmartInsightPage',
  methods: {
    selectAgent(agentId) {
      // 当点击智能体卡片时，导航到智能体编辑页面
      this.$router.push(`/main/insight-engine/smart-insight/${agentId}/editor`);
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

.page-title {
  font-size: var(--font-size-h2); /* H2 / 标题 / 26px */
  font-weight: 600;
  color: var(--color-title); /* 标题颜色 1F0C0C */
  margin-right: 15px; /* 与描述的间距 */
}

.page-description {
  font-size: var(--font-size-body); /* 正文 / 14px */
  color: var(--color-description); /* 说明文字 AD8888 */
  flex-grow: 1; /* 占据尽可能多的空间 */
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
  border-radius: var(--border-radius-medium);
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

.search-btn:hover {
  background-color: var(--color-neutral-light);
}

.search-btn img {
  width: 20px;
  height: 20px;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* 响应式卡片布局 */
  gap: 20px;
  flex-grow: 1; /* 让网格占据剩余空间 */
}

.agent-card {
  background-color: var(--white-color); /* 卡片背景色 */
  border-radius: var(--border-radius-large);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.agent-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.agent-card-image {
  width: 100%;
  max-width: 180px; /* 控制图片大小 */
  height: auto;
  margin-bottom: 15px;
  border-radius: var(--border-radius-medium);
}

/* 占位图片，你需要准备 agent-card-image1.png, agent-card-image2.png 等图片 */
/* 这里只是一个占位符，实际图片可能需要你去设计或找到 */
.agent-card:nth-child(1) .agent-card-image {
  background-color: #f7e6e6; /* 示例占位色 */
  content: url('../../assets/bg1.png'); /* 使用你提供的图片作为示例 */
  object-fit: cover;
  height: 150px;
}
.agent-card:nth-child(2) .agent-card-image {
  background-color: #e6f7e6; /* 示例占位色 */
  content: url('../../assets/bg2.png'); /* 使用你提供的图片作为示例 */
  object-fit: cover;
  height: 150px;
}
.agent-card:nth-child(3) .agent-card-image {
  background-color: #e6e6f7; /* 示例占位色 */
  content: url('../../assets/bg2.png'); /* 使用你提供的图片作为示例 */
  object-fit: cover;
  height: 150px;
}
.agent-card:nth-child(4) .agent-card-image {
  background-color: #f7f7e6; /* 示例占位色 */
  content: url('../../assets/bg2.png'); /* 使用你提供的图片作为示例 */
  object-fit: cover;
  height: 150px;
}


.agent-name {
  font-size: var(--font-size-h3); /* H3 / 小标题 / 18px */
  font-weight: 500;
  color: var(--color-title); /* 标题颜色 1F0C0C */
  margin-bottom: 10px;
}

.agent-description {
  font-size: var(--font-size-body); /* 正文 / 14px */
  color: var(--color-description); /* 说明文字 AD8888 */
  line-height: 1.5;
  margin-bottom: 0;
}

.add-agent-card {
  border: 2px dashed var(--theme-color-60); /* 虚线边框 E9E9E9 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 250px; /* 确保高度与其他卡片大致相同 */
}

.add-icon {
  font-size: 60px;
  color: var(--color-neutral-mid-gray); /* 中灰 D0D0D0 */
  margin-bottom: 10px;
}

.add-agent-card .agent-name {
  color: var(--color-neutral-mid-gray);
}
</style>