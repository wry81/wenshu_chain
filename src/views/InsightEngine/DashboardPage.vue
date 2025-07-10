<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h2 class="page-title">
        趋势追踪
      </h2>
      <div class="header-actions">
        <button class="filter-btn">
          筛选
        </button>
        <button class="add-widget-btn">
          添加组件
        </button>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="chart-card square">
        <h3 class="chart-title">
          存储空间
        </h3>
        <div class="chart-container">
          <DoughnutChart
            v-if="doughnutChartData"
            :data="doughnutChartData"
            :options="chartOptions"
          />
          <div
            v-else
            class="loading-placeholder"
          >
            加载存储空间分布图...
          </div>
        </div>
      </div>

      <div class="chart-card square">
        <h3 class="chart-title">
          资产分类
        </h3>
        <div class="chart-container">
          <BarChart
            v-if="barChartData"
            :data="barChartData"
            :options="barChartOptions"
          />
          <div
            v-else
            class="loading-placeholder"
          >
            加载资产分类图表...
          </div>
        </div>
      </div>

      <div class="chart-card rectangle">
        <h3 class="chart-title">
          热搜追踪
        </h3>
        <div class="chart-container">
          <LineChart
            v-if="areaChartData"
            :data="areaChartData"
            :options="areaChartOptions"
          />
          <div
            v-else
            class="loading-placeholder"
          >
            加载热搜追踪趋势图...
          </div>
        </div>
      </div>

      <div class="chart-card rectangle list-card insight-list">
        <h3 class="chart-title">
          最新洞察
        </h3>
        <div class="list-items-container">
          <div
            v-for="(item, index) in latestInsightsData"
            :key="index"
            class="list-item"
          >
            <div class="item-icon">
              <img
                src="../../assets/file.svg"
                alt="File Icon"
                class="icon-file"
              >
            </div>
            <div class="item-content">
              <span class="item-title">{{ item.title }}</span>
              <p
                v-if="item.description"
                class="item-description"
              >
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card square list-card prediction-list">
        <h3 class="chart-title">
          爆款预测
        </h3>
        <div class="list-items-container">
          <div
            v-for="(item, index) in hotPredictionData"
            :key="index"
            class="list-item"
          >
            <div class="item-icon">
              <img
                v-if="item.icon === 'trend'"
                src="../../assets/file.svg"
                alt="Trend Icon"
                class="icon-trend"
              >
              <img
                v-else-if="item.icon === 'warning'"
                src="../../assets/file.svg"
                alt="Warning Icon"
                class="icon-warning"
              >
            </div>
            <div class="item-content">
              <span class="item-title">{{ item.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card square stat-card generated-reports">
        <h3 class="chart-title">
          已生成报告
        </h3>
        <div class="stat-content">
          <span class="stat-number">{{ generatedReportsCount }}</span>
        </div>
      </div>
    </div>

    <div class="dashboard-header section-header">
      <h2 class="page-title">
        产品数据
      </h2>
    </div>

    <div class="dashboard-grid">
      <div class="chart-card rectangle list-card recent-projects">
        <h3 class="chart-title">
          近期项目
        </h3>
        <div class="list-items-container">
          <div
            v-for="(item, index) in recentProjectsData"
            :key="index"
            class="list-item"
          >
            <div class="item-icon">
              <img
                src="../../assets/file.svg"
                alt="File Icon"
                class="icon-file"
              >
            </div>
            <div class="item-content">
              <span class="item-title">{{ item.title }}</span>
              <p
                v-if="item.description"
                class="item-description"
              >
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card square stat-card incubated-projects">
        <h3 class="chart-title">
          已孵化项目
        </h3>
        <div class="stat-content">
          <span class="stat-number">{{ incubatedProjectsCount }}</span>
        </div>
      </div>

      <div class="chart-card square stat-card research-projects">
        <h3 class="chart-title">
          在研项目
        </h3>
        <div class="stat-content">
          <span class="stat-number">{{ researchProjectsCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Doughnut as DoughnutChart, Bar as BarChart, Line as LineChart, Scatter as ScatterChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

export default {
  name: 'DashboardPage',
  components: {
    DoughnutChart,
    BarChart,
    LineChart,
  },
  data() {
    // 通用图表配置
    const commonChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    };

    // 热搜追踪面积图特殊配置 (LineChart now acts as an Area Chart)
    const areaChartOptions = {
      ...commonChartOptions,
      elements: {
        line: {
          tension: 0.4, // 平滑曲线
          borderWidth: 2, // 线条宽度
        },
        point: {
          radius: 4, // 数据点半径
          borderWidth: 1, // 数据点边框宽度
          backgroundColor: 'white', // 数据点背景色
          borderColor: 'white', // 数据点边框色
        },
      },
      scales: {
        x: {
          grid: {
            display: false, // 隐藏 X 轴的垂直网格线
          },
          ticks: {
            color: '#666', // X轴刻度文字颜色
          },
        },
        y: {
          beginAtZero: true, // Y 轴从 0 开始
          min: 0, // 最小值
          max: 100, // 最大值
          ticks: {
            stepSize: 20, // 步长 20
            color: '#666', // Y轴刻度文字颜色
            callback: function(value) {
              return value;
            }
          },
          grid: {
            display: true, // 显示 Y 轴的水平网格线
            color: 'rgba(0, 0, 0, 0.1)', // 网格线颜色，浅灰色
            drawBorder: false, // 不绘制Y轴边框
          },
        },
      },
      plugins: {
        ...commonChartOptions.plugins,
        legend: {
          display: true, // 显示图例
          position: 'top', // 图例位置在顶部
          align: 'end', // 图例在顶部靠右对齐
          labels: {
            usePointStyle: true, // 使用点样式（圆形）作为图例标记
            color: '#333', // 图例文字颜色
            boxWidth: 8, // 图例标记的宽度
            boxHeight: 8, // 图例标记的高度
            padding: 15, // 图例项之间的内边距
          },
        },
      },
    };

    // 条形图特殊配置（横向显示）
    const barChartOptions = {
      ...commonChartOptions,
      indexAxis: 'y', // 横向显示
      scales: {
        x: {
          display: false, // 隐藏X轴
          grid: {
            display: false // 隐藏X轴网格线
          }
        },
        y: {
          grid: {
            display: false // 隐藏Y轴网格线
          }
        }
      },
      plugins: {
        ...commonChartOptions.plugins,
        legend: {
          display: false // 条形图不显示图例
        }
      },
      elements: {
        bar: {
          borderRadius: {
            topLeft: 16,
            bottomLeft: 16,
            topRight: 16,
            bottomRight: 16
          }
        }
      }
    };

    return {
      // 图表数据
      doughnutChartData: {
        labels: ['已用', '未用'],
        datasets: [
          {
            backgroundColor: ['#9C2323', '#F8D6D6'],
            data: [21.5, 78.5],
            borderWidth: 0, // 甜甜圈图边框设为0
          },
        ],
      },
      barChartData: {
        labels: ['文物', '区域', '非遗', '其他'],
        datasets: [
          {
            label: '资产分类',
            backgroundColor: ['#6B1211', '#9C2323', '#F8D6D6', '#F8D6D6'], // 颜色根据图片微调
            data: [65, 59, 80, 81], // 确保数据点数量与标签数量匹配
          },
        ],
      },
      // 修改后的 areaChartData (用于热搜追踪)
      areaChartData: {
        labels: [
          '外国人', '马面裙', '文化挪用', '共创', '抽象',
          '特朗普', '文旅局', 'Z世代', '国潮', '元宇宙',
          '情感经济', '发疯文学'
        ],
        datasets: [
          {
            label: '上月统计',
            backgroundColor: 'rgba(235, 100, 100, 0.1)', // 红色系填充，透明度较低
            borderColor: '#E74C3C', // 红色边框
            pointBackgroundColor: '#E74C3C', // 数据点背景色
            pointBorderColor: '#fff', // 数据点边框色
            pointRadius: 4, // 数据点半径
            pointHoverRadius: 6, // 鼠标悬停时的数据点半径
            data: [90, 20, 75, 65, 50, 47, 70, 30, 62, 65, 48, 85], // 根据图片大致估算
            fill: true, // 启用面积填充
          },
          {
            label: '本月统计',
            backgroundColor: 'rgba(52, 152, 219, 0.1)', // 蓝色系填充，透明度较低
            borderColor: '#3498DB', // 蓝色边框
            pointBackgroundColor: '#3498DB',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            data: [85, 60, 70, 78, 20, 80, 95, 45, 90, 15, 50, 75], // 根据图片大致估算
            fill: true,
          },
          {
            label: '下月预测',
            backgroundColor: 'rgba(150, 150, 150, 0.1)', // 灰色系填充，透明度较低
            borderColor: '#95A5A6', // 灰色边框
            pointBackgroundColor: '#95A5A6',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            data: [95, 50, 60, 45, 35, 60, 60, 15, 25, 75, 18, 65], // 根据图片大致估算
            fill: true,
          },
        ],
      },
      lineChartData: { // 这里是你的“新增用户趋势”，图片中没有直接对应，保持不变
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        datasets: [
          {
            label: '新增用户',
            backgroundColor: '#FF6384',
            borderColor: '#FF6384',
            data: [30, 45, 25, 50, 40, 60, 35],
            fill: false,
          },
        ],
      },
      scatterChartData: { // 图片中没有，保持不变
        datasets: [
          {
            label: '产品数据',
            backgroundColor: '#9966FF',
            data: [
              { x: 10, y: 20 },
              { x: 15, y: 10 },
              { x: 5, y: 25 },
              { x: 20, y: 12 },
              { x: 8, y: 30 },
            ],
          },
        ],
      },
      productBarChartData: { // 图片中没有，保持不变
        labels: ['电子产品', '服装', '家居用品', '食品', '图书'],
        datasets: [
          {
            label: '市场份额 (%)',
            backgroundColor: ['#FFCD56', '#4BC0C0', '#F8D6D6', '#C7CBCE', '#A17A7A'],
            data: [25, 30, 15, 10, 20],
          },
        ],
      },

      // **新增：最新洞察数据**
      latestInsightsData: [
        { icon: 'file', title: '嘉善大云镇文旅资源分析', description: '大云镇隶属于嘉兴市嘉善县，位于......' },
        { icon: 'file', title: '屏门乡农副产品市场调研', description: '淳安县屏门乡农副产品多种多样，......' },
        { icon: 'file', title: '衢州老城文化街区开发...', description: '衢州老城文化街区以水亭街为中心......' },
      ],

      // **新增：爆款预测数据**
      hotPredictionData: [
        { icon: 'trend', title: '李白“如何呢”亚克力立牌' },
        { icon: 'warning', title: '三星堆黄金面具水杯办公......' },
        { icon: 'warning', title: '秦兵马俑表情包解压摆件......' },
      ],

      // **新增：已生成报告数量**
      generatedReportsCount: 28,

      // **新增：近期项目数据**
      recentProjectsData: [
        { icon: 'file', title: '嘉善塘宝盲盒', description: '塘宝以嘉善西塘IP形象为基础, 衍......' },
        { icon: 'file', title: '屏门乡金陵纹筷架', description: '筷架外观取自金陵村特色屋顶瓦纹......' },
      ],

      // **新增：已孵化项目数量**
      incubatedProjectsCount: 12,

      // **新增：在研项目数量**
      researchProjectsCount: 3,

      productSalesData: [ // 图片中没有，保持不变
        { name: '智能手机 X', sales: '$25,000' },
        { name: '无线耳机 Pro', sales: '$18,000' },
        { name: '智能手表 Series 5', sales: '$12,000' },
        { name: '便携式充电宝', sales: '$8,500' },
        { name: '蓝牙音箱 Mini', sales: '$7,200' },
      ],
      inventoryData: [ // 图片中没有，保持不变
        { name: 'T恤', stock: 120 },
        { name: '牛仔裤', stock: 45 },
        { name: '运动鞋', stock: 15 },
        { name: '连衣裙', stock: 70 },
        { name: '夹克', stock: 8 },
      ],

      // 图表配置
      chartOptions: commonChartOptions, // 通用配置
      areaChartOptions: areaChartOptions, // 热搜追踪图专用配置
      barChartOptions: barChartOptions, // 资产分类条形图专用配置
    };
  },
};
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  background-color: var(--color-background); /* 假设这是一个浅背景色，如 #F8F8F8 */
  color: var(--color-text-body); /* 假设文本颜色 */
  margin: 0px 50px;
  flex-grow: 1;
  max-width: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0;
}

.page-title {
  font-size: var(--font-size-h2); /* 假设 h2 大小为 24px-28px */
  font-weight: 600; /* 或 bold */
  color: var(--color-title); /* 深色标题，如 #333 */
}

.section-header {
  margin-top: 40px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-btn,
.add-widget-btn {
  padding: 5px 15px;
  border-color: transparent;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); /* 轻微阴影 */
  border-radius: var(--border-radius-large); /* 假设 8px-12px */
  background-color: var(--white-color); /* 白色背景 */
  color: var(--color-text-body);
  cursor: pointer;
  font-size: var(--font-size-body); /* 假设 14px-16px */
  transition: all 0.3s ease;
}

.filter-btn:hover,
.add-widget-btn:hover {
  background-color: var(--color-neutral-light); /* 浅灰色背景 */
  border-color: var(--theme-color-40); /* 边框颜色 */
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4列布局 */
  gap: 20px; /* 卡片之间的间距 */
  width: 100%;
  /* 确保所有卡片高度一致 */
  grid-auto-rows: minmax(320px, auto); /* 每行最小高度，并允许根据内容自动增长 */
}

.chart-card {
  background-color: var(--white-color);
  border-radius: 16px; /* 统一大圆角 */
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: auto; /* 允许高度由内容和 grid-auto-rows 控制 */
}

/* 正方形卡片样式 - 占1列 */
.chart-card.square {
  grid-column: span 1;
}

/* 长方形卡片样式 - 占2列 */
.chart-card.rectangle {
  grid-column: span 2;
}

.chart-title {
  font-size: var(--font-size-h3); /* 假设 h3 大小为 18px-20px */
  font-weight: 600; /* 或 bolder */
  color: var(--color-title);
  margin-bottom: 15px;
  padding: 0; /* 标题不再需要额外 padding，卡片自带 padding */
}

.chart-container {
  flex-grow: 1; /* 确保容器填充父元素剩余空间 */
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中加载提示 */
  align-items: center; /* 水平居中加载提示 */
  overflow: hidden; /* 防止图表内容溢出 */
}

.loading-placeholder {
  color: var(--color-description);
  font-size: var(--font-size-body);
  text-align: center;
}

/* --- 新增或修改的样式 --- */

/* 列表卡片 (最新洞察, 爆款预测, 近期项目) */
.chart-card.list-card {
  .chart-title {
    margin-bottom: 10px;
  }
}

.list-items-container {
  flex-grow: 1; /* 允许列表容器填充可用空间 */
  display: flex;
  flex-direction: column;
  gap: 10px; /* 列表项之间的间距 */
  padding-top: 5px; /* 标题和列表之间的间距 */
}

.list-item {
  display: flex;
  align-items: center;
  gap: 15px; /* 图标和文本之间的间距 */
  background-color: #FDF9F9; /* 浅粉色背景，根据图片调整 */
  border-radius: 12px; /* 列表项的圆角 */
  padding: 15px 20px; /* 内边距 */
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  box-shadow: none; /* 列表项通常没有阴影 */
}

.list-item:hover {
  background-color: #FAEDED; /* 鼠标悬停时的背景色 */
}

.item-icon {
  flex-shrink: 0; /* 防止图标缩小 */
  width: 20px; /* 图标宽度 */
  height: 20px; /* 图标高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 针对 <img> 标签的 SVG 样式调整 */
.item-icon img {
  width: 100%;
  height: 100%;
  /* 如果你的 SVG 文件内部没有设置颜色，你可能需要通过 filter 属性来改变颜色
     例如：filter: invert(50%) sepia(80%) saturate(1000%) hue-rotate(200deg) brightness(80%);
     或者直接编辑 SVG 文件内部的 fill/stroke 属性
  */
}

/* 爆款预测图标的特定颜色 */
/* 注意：使用 <img> 标签时，直接通过 CSS 改变 SVG 颜色比较困难。
   如果需要改变颜色，建议：
   1. 直接修改 SVG 文件内部的 fill/stroke 属性。
   2. 使用 SVG Sprite 或组件化的方式，这样可以更灵活地控制 SVG 内部元素的颜色。
   3. 如果 SVG 足够简单且颜色单一，可以尝试 CSS filter 属性。
   为了兼容性，以下颜色类将保留，但可能对 <img> 引入的 SVG 无效，除非 SVG 文件本身支持 currentColor 或你使用 filter。
*/
.prediction-list .item-icon .icon-trend {
    /* filter: invert(30%) sepia(70%) saturate(600%) hue-rotate(340deg) brightness(80%); */
}
.prediction-list .item-icon .icon-warning {
    /* filter: invert(60%) sepia(80%) saturate(600%) hue-rotate(0deg) brightness(120%); */
}
/* 如果你想让文件图标变色，也可以添加类似样式 */
.icon-file {
  /* filter: invert(70%) sepia(10%) saturate(0%) hue-rotate(180deg) brightness(80%); */
}


.item-content {
  flex-grow: 1; /* 允许内容填充剩余空间 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 隐藏溢出的文本 */
}

.item-title {
  font-size: 16px; /* 标题字体大小 */
  font-weight: 500;
  color: var(--color-title);
  white-space: nowrap; /* 不换行 */
  overflow: hidden; /* 溢出隐藏 */
  text-overflow: ellipsis; /* 显示省略号 */
}

.item-description {
  font-size: 14px; /* 描述字体大小 */
  color: #888; /* 描述颜色 */
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 统计数字卡片 (已生成报告, 已孵化项目, 在研项目) */
.chart-card.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中内容 */
  align-items: center; /* 水平居中内容 */
  text-align: center;
}

.stat-content {
  flex-grow: 1; /* 允许内容区域填充剩余空间 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.stat-number {
  font-size: 80px; /* 巨大数字字体大小 */
  font-weight: 900; /* 加粗 */
  color: #6B1211; /* 深红色，根据图片调整 */
  line-height: 1; /* 调整行高，避免数字过高 */
  margin-top: -10px; /* 微调位置 */
}

/* 产品数据部分的表格样式 */
.table-container {
  overflow-x: auto;
  justify-content: flex-start;
  align-items: flex-start;
  flex-grow: 1;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 8px 12px;
  border: 1px solid var(--color-neutral-light-gray);
  text-align: left;
}

.data-table th {
  background-color: var(--color-neutral-light);
  font-weight: 600;
  color: var(--color-title);
}

.data-table tr:nth-child(even) {
  background-color: var(--color-background);
}

.stock-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 500;
}

.status-sufficient {
  background-color: #e6ffe6;
  color: #008000;
}

.status-warning {
  background-color: #fffacd;
  color: #ffa500;
}

.status-low {
  background-color: #ffe6e6;
  color: #ff0000;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: minmax(300px, auto);
  }

  .chart-card.rectangle {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(280px, auto);
  }

  .chart-card.square,
  .chart-card.rectangle {
    grid-column: span 1;
  }
}
</style>