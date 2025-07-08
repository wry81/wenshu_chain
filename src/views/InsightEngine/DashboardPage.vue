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
      <!-- 第一行：两个正方形和一个长方形 -->
      <div class="chart-card square">
        <h3 class="chart-title">存储空间</h3>
        <div class="chart-container">
          <DoughnutChart v-if="doughnutChartData" :data="doughnutChartData" :options="chartOptions" />
          <div v-else class="loading-placeholder">加载存储空间分布图...</div>
        </div>
      </div>

      <div class="chart-card square">
        <h3 class="chart-title">每月访问量</h3>
        <div class="chart-container">
          <BarChart v-if="barChartData" :data="barChartData" :options="barChartOptions" />
          <div v-else class="loading-placeholder">加载每月访问量图...</div>
        </div>
      </div>

      <div class="chart-card rectangle">
        <h3 class="chart-title">新增用户趋势</h3>
        <div class="chart-container">
          <LineChart v-if="lineChartData" :data="lineChartData" :options="chartOptions" />
          <div v-else class="loading-placeholder">加载新增用户趋势图...</div>
        </div>
      </div>

      <!-- 第二行：一个长方形和两个正方形 -->
      <div class="chart-card rectangle">
        <h3 class="chart-title">总收入趋势</h3>
        <div class="chart-container">
          <LineChart v-if="areaChartData" :data="areaChartData" :options="areaChartOptions" />
          <div v-else class="loading-placeholder">加载总收入趋势图...</div>
        </div>
      </div>

      <div class="chart-card square">
        <h3 class="chart-title">产品性能与成本关系</h3>
        <div class="chart-container">
          <ScatterChart v-if="scatterChartData" :data="scatterChartData" :options="chartOptions" />
          <div v-else class="loading-placeholder">加载产品性能与成本关系图...</div>
        </div>
      </div>

      <div class="chart-card square">
        <h3 class="chart-title">自定义图表 1</h3>
        <div class="chart-container">
          <div class="loading-placeholder">这是一个自定义图表区域，可以放置任意数据可视化</div>
        </div>
      </div>
    </div>

    <div class="dashboard-header section-header">
      <h2 class="page-title">产品数据</h2>
    </div>

    <div class="dashboard-grid">
      <!-- 产品数据部分也采用相同布局 -->
      <div class="chart-card rectangle">
        <h3 class="chart-title">产品类别市场份额</h3>
        <div class="chart-container">
          <BarChart v-if="productBarChartData" :data="productBarChartData" :options="chartOptions" />
          <div v-else class="loading-placeholder">加载产品类别市场份额图...</div>
        </div>
      </div>
      
      <div class="chart-card square">
        <h3 class="chart-title">产品销售额排行</h3>
        <div class="chart-container table-container">
          <table class="data-table" v-if="productSalesData.length">
            <thead>
              <tr>
                <th>产品名称</th>
                <th>销售额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, index) in productSalesData" :key="index">
                <td>{{ product.name }}</td>
                <td>{{ product.sales }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="loading-placeholder">暂无产品销售数据</div>
        </div>
      </div>
      
      <div class="chart-card square">
        <h3 class="chart-title">库存状况</h3>
        <div class="chart-container table-container">
          <table class="data-table" v-if="inventoryData.length">
            <thead>
              <tr>
                <th>产品名称</th>
                <th>库存量</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in inventoryData" :key="index">
                <td>{{ item.name }}</td>
                <td>{{ item.stock }}</td>
                <td>
                  <span :class="['stock-status', item.stock > 50 ? 'status-sufficient' : item.stock > 10 ? 'status-warning' : 'status-low']">
                    {{ item.stock > 50 ? '充足' : item.stock > 10 ? '警告' : '不足' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="loading-placeholder">暂无库存数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 脚本部分保持不变
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
    ScatterChart,
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

  // 面积图特殊配置
  const areaChartOptions = {
    ...commonChartOptions,
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
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
        },
      ],
    },
    barChartData: {
      labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
      datasets: [
        {
          label: '访问量',
          backgroundColor: '#42A5F5',
          data: [65, 59, 80, 81, 56, 55],
        },
      ],
    },
    lineChartData: {
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
    areaChartData: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: '总收入 ($)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          data: [12000, 15000, 13000, 18000],
          fill: true,
        },
      ],
    },
    scatterChartData: {
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
    productBarChartData: {
      labels: ['电子产品', '服装', '家居用品', '食品', '图书'],
      datasets: [
        {
          label: '市场份额 (%)',
          backgroundColor: ['#FFCD56', '#4BC0C0', '#F8D6D6', '#C7CBCE', '#A17A7A'],
          data: [25, 30, 15, 10, 20],
        },
      ],
    },
    productSalesData: [
      { name: '智能手机 X', sales: '$25,000' },
      { name: '无线耳机 Pro', sales: '$18,000' },
      { name: '智能手表 Series 5', sales: '$12,000' },
      { name: '便携式充电宝', sales: '$8,500' },
      { name: '蓝牙音箱 Mini', sales: '$7,200' },
    ],
    inventoryData: [
      { name: 'T恤', stock: 120 },
      { name: '牛仔裤', stock: 45 },
      { name: '运动鞋', stock: 15 },
      { name: '连衣裙', stock: 70 },
      { name: '夹克', stock: 8 },
    ],
    
    // 图表配置
    chartOptions: commonChartOptions, // 通用配置
    areaChartOptions: areaChartOptions, // 面积图专用配置
    barChartOptions: barChartOptions, // 条形图专用配置（横向）
    
    // 其他图表可以继续添加专用配置...
  };
},
};
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  background-color: var(--color-background);
  color: var(--color-text-body);
  margin: 0px 50px;
  flex-grow: 1;
  max-width: 100%; /* 添加最大宽度限制 */
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 0px;
}

.page-title {
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-title);
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
  box-shadow: var(--box-shadow);
  border-radius: var(--border-radius-large);
  background-color: var(--white-color);
  color: var(--color-text-body); 
  cursor: pointer;
  font-size: var(--font-size-body);
  transition: all 0.3s ease;
}

.filter-btn:hover,
.add-widget-btn:hover {
  background-color: var(--color-neutral-light);
  border-color: var(--theme-color-40);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)); /* 使用minmax防止无限扩展 */
  gap: 20px;
  width: 100%;
}

.chart-card {
  background-color: var(--white-color);
  border-radius: var(--border-radius-large);
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

/* 正方形卡片样式 - 占1列 */
.chart-card.square {
  grid-column: span 1;
  aspect-ratio: 1; /* 简化的1:1宽高比 */
  min-height: 300px; /* 设置最小高度 */
}

/* 长方形卡片样式 - 占2列 */
.chart-card.rectangle {
  grid-column: span 2;
  aspect-ratio: 2/1; /* 2:1宽高比 */
  min-height: 300px; /* 设置最小高度 */
}

.chart-title {
  font-size: var(--font-size-h3);
  font-weight: 500;
  color: var(--color-title);
  margin-bottom: 15px;
  padding: 0 20px; /* 添加内边距 */
}

.chart-container {
  height: 80%; /* 确保容器填满父元素 */
  display: flex;
  flex-direction: column;
}

.loading-placeholder {
  color: var(--color-description);
  font-size: var(--font-size-body);
  text-align: center;
}

.table-container {
  overflow-x: auto;
  justify-content: flex-start;
  align-items: flex-start;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .chart-card.rectangle {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-card.square,
  .chart-card.rectangle {
    grid-column: span 1;
    aspect-ratio: auto; /* 小屏幕取消固定宽高比 */
  }
}
</style>