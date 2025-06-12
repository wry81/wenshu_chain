<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h2 class="page-title">趋势追踪</h2>
      <div class="header-actions">
        <button class="filter-btn">筛选</button>
        <button class="add-widget-btn">添加组件</button>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="chart-card">
        <h3 class="chart-title">用户来源分布</h3>
        <div class="chart-container">
          <div class="loading-placeholder">数据图占位符 (环形图)</div>
        </div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">每月访问量</h3>
        <div class="chart-container">
          <div class="loading-placeholder">数据图占位符 (条形图)</div>
        </div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">新增用户趋势</h3>
        <div class="chart-container">
          <div class="loading-placeholder">数据图占位符 (折线图)</div>
        </div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">总收入趋势</h3>
        <div class="chart-container">
          <div class="loading-placeholder">数据图占位符 (面积图)</div>
        </div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">产品性能与成本关系</h3>
        <div class="chart-container">
          <div class="loading-placeholder">数据图占位符 (散点图)</div>
        </div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">自定义图表 1</h3>
        <div class="chart-container">
          <div class="loading-placeholder">空白图表占位符</div>
        </div>
      </div>
    </div>

    <div class="dashboard-header section-header">
      <h2 class="page-title">产品数据</h2>
    </div>

    <div class="dashboard-grid">
      <div class="chart-card">
        <h3 class="chart-title">产品类别市场份额</h3>
        <div class="chart-container">
          <div class="loading-placeholder">数据图占位符 (产品条形图)</div>
        </div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">产品销售额排行</h3>
        <div class="chart-container">
          <div class="loading-placeholder">空白图表占位符</div>
        </div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">库存状况</h3>
        <div class="chart-container">
          <div class="loading-placeholder">空白图表占位符</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 暂时不需要 Chart.js 相关的导入，因为我们不渲染图表
// import { Doughnut as DoughnutChart, Bar as BarChart, Line as LineChart, Scatter as ScatterChart } from 'vue-chartjs';
// import {
//   Chart as ChartJS,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Filler
// } from 'chart.js';

// ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

// const AreaChart = {
//   extends: LineChart,
//   props: ['chartData', 'options'],
//   mounted() {
//     this.renderChart(this.chartData, this.options);
//   }
// };

// **暂时移除对 dashboardData 的导入**
// import {
//   doughnutChartData,
//   barChartData,
//   lineChartData,
//   areaChartData,
//   scatterChartData,
//   productBarChartData,
//   commonChartOptions
// } from './dashboardData';

export default {
  name: 'DashboardPage',
  components: {
    // 暂时不注册图表组件
    // DoughnutChart,
    // BarChart,
    // LineChart,
    // AreaChart,
    // ScatterChart,
  },
  data() {
    return {
      // **所有图表数据暂时初始化为 null 或空对象**
      // 当你需要添加数据时，再把这些替换为实际的数据结构
      doughnutChartData: null,
      barChartData: null,
      lineChartData: null,
      areaChartData: null,
      scatterChartData: null,
      productBarChartData: null,
      chartOptions: null, // 图表配置也暂时置空
    };
  },
};
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  background-color: var(--color-background); /* 使用图片提供的背景色 FDF8F8 */
  color: var(--color-text-body); /* 默认文字颜色 */
  margin: 0px 50px; /* 移除可能的外部margin，让它填充父容器 */
  flex-grow: 1; /* 确保内容区可以伸展 */
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 0px; /* 根据图片，标题和按钮与卡片边缘对齐，卡片有padding */
}

.page-title {
  font-size: var(--font-size-h2); /* H2 / 标题 / 26px */
  font-weight: 600;
  color: var(--color-title); /* 标题颜色 1F0C0C */
}

.section-header {
  margin-top: 40px; /* 段落间距 */
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-btn,
.add-widget-btn {
  padding: 5px 15px;
  border-color: transparent;
  box-shadow: var(--box-shadow);
  border-radius: var(--border-radius-large); /* 中等圆角 */
  background-color: var(--white-color); /* 白色背景 */
  color: var(--color-text-body); 
  cursor: pointer;
  font-size: var(--font-size-body); /* 正文 / 14px */
  transition: all 0.3s ease;
}

.filter-btn:hover,
.add-widget-btn:hover {
  background-color: var(--color-neutral-light); /* 悬停背景色 F3F3F3 */
  border-color: var(--theme-color-40); /* 悬停描边色 F8D6D6 */
}

.dashboard-grid {
  display: grid;
  flex-flow: 1;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* 响应式布局 */
  gap: 20px; /* 卡片间距 */
}

.chart-card {
  background-color: var(--white-color); /* 卡片背景色 */
  border-radius: var(--border-radius-large); /* 大圆角 */
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* 柔和阴影，根据图片调整 */
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.chart-title {
  font-size: var(--font-size-h3); /* H3 / 小标题 / 18px */
  font-weight: 500;
  color: var(--color-title); /* 标题颜色 1F0C0C */
  margin-bottom: 15px;
}

.chart-container {
  flex-grow: 1; /* 填充剩余空间 */
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px; /* 确保图表容器有最小高度 */
  border: 1px dashed var(--color-neutral-light-gray); /* 添加虚线边框以示占位符 */
  border-radius: var(--border-radius-medium); /* 占位符圆角 */
}

.loading-placeholder {
  color: var(--color-description); /* 说明文字颜色 AD8888 */
  font-size: var(--font-size-body); /* 正文 / 14px */
}
</style>