<template>
  <div class="history-page">
    <!-- 页面标题和筛选 -->
    <div class="page-header">
      <h2>IP活化历史</h2>
      
      <div class="filter-section">
        <div class="filter-group">
          <label>筛选:</label>
          <select
            v-model="filters.status"
            @change="loadHistory"
          >
            <option value="">
              全部状态
            </option>
            <option value="completed">
              已完成
            </option>
            <option value="running">
              运行中
            </option>
            <option value="failed">
              失败
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>排序:</label>
          <select
            v-model="filters.sortBy"
            @change="loadHistory"
          >
            <option value="create_time">
              创建时间
            </option>
            <option value="update_time">
              更新时间
            </option>
            <option value="run_name">
              运行名称
            </option>
          </select>
        </div>
        
        <div class="search-group">
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="搜索IP项目名称..." 
            class="search-input"
            @input="debouncedSearch"
          >
          <button
            class="search-btn"
            @click="loadHistory"
          >
            搜索
          </button>
        </div>
      </div>
    </div>

    <!-- 历史记录表格 -->
    <div class="history-table-container">
      <table class="history-table">
        <thead>
          <tr>
            <th>IP项目</th>
            <th>工作流</th>
            <th>关联IP</th>
            <th>创建时间</th>
            <th>状态</th>
            <th>格式</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="record in historyList"
            :key="record.run_id"
            class="table-row"
          >
            <td>
              <div class="project-info">
                <div class="project-icon">
                  <img
                    v-if="record.thumbnail"
                    :src="record.thumbnail"
                    alt="项目图标"
                  >
                  <div
                    v-else
                    class="default-icon"
                  >
                    📋
                  </div>
                </div>
                <div class="project-details">
                  <div class="project-name">
                    {{ record.run_name || '未命名项目' }}
                  </div>
                  <div class="project-desc">
                    {{ truncateText(record.agent_description, 30) }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span class="workflow-name">{{ getWorkflowDisplayName(record.agent_name) }}</span>
            </td>
            <td>
              <span class="related-ip">{{ record.agent_name }}</span>
            </td>
            <td>
              <div class="time-info">
                <div class="date">
                  {{ formatDate(record.create_time) }}
                </div>
                <div class="time">
                  {{ formatTime(record.create_time) }}
                </div>
              </div>
            </td>
            <td>
              <span :class="['status-badge', record.status]">
                {{ getStatusText(record.status) }}
              </span>
            </td>
            <td>
              <div class="format-info">
                <span
                  v-if="record.node_count > 0"
                  class="format-tag"
                >
                  {{ getFormatText(record) }}
                </span>
                <span
                  v-else
                  class="format-tag empty"
                >无输出</span>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="action-btn view-btn"
                  @click="viewDetails(record)"
                >
                  查看
                </button>
                <button
                  class="action-btn download-btn"
                  :disabled="record.status !== 'completed'" 
                  @click="downloadResults(record)"
                >
                  下载
                </button>
                <button
                  class="action-btn delete-btn"
                  @click="deleteRecord(record)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空状态 -->
      <div
        v-if="!loading && historyList.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">
          📝
        </div>
        <h3>暂无历史记录</h3>
        <p>开始使用IP活化引擎创建您的第一个项目吧！</p>
      </div>

      <!-- 加载状态 -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <div class="spinner" />
        <p>正在加载历史记录...</p>
      </div>
    </div>

    <!-- 分页器 -->
    <div
      v-if="pagination.total > 0"
      class="pagination-container"
    >
      <div class="pagination-info">
        显示第 {{ (pagination.page - 1) * pagination.limit + 1 }} - 
        {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 条，
        共 {{ pagination.total }} 条记录
      </div>
      <div class="pagination-controls">
        <button 
          :disabled="pagination.page <= 1" 
          class="page-btn"
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </button>
        
        <span class="page-numbers">
          <button 
            v-for="page in getPageNumbers()" 
            :key="page"
            :class="['page-num', { active: page === pagination.page }]"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </span>
        
        <button 
          :disabled="pagination.page >= pagination.pages" 
          class="page-btn"
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click="closeDetailModal"
    >
      <div
        class="modal-content"
        @click.stop
      >
        <div class="modal-header">
          <h3>运行详情</h3>
          <button
            class="close-btn"
            @click="closeDetailModal"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <div
            v-if="selectedRecord"
            class="detail-content"
          >
            <div class="basic-info">
              <h4>基本信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>项目名称:</label>
                  <span>{{ selectedRecord.run_name }}</span>
                </div>
                <div class="info-item">
                  <label>工作流:</label>
                  <span>{{ selectedRecord.agent_name }}</span>
                </div>
                <div class="info-item">
                  <label>状态:</label>
                  <span :class="['status-badge', selectedRecord.status]">
                    {{ getStatusText(selectedRecord.status) }}
                  </span>
                </div>
                <div class="info-item">
                  <label>创建时间:</label>
                  <span>{{ formatFullDateTime(selectedRecord.create_time) }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="selectedRecord.nodes && selectedRecord.nodes.length > 0"
              class="nodes-info"
            >
              <h4>节点执行记录</h4>
              <div class="nodes-list">
                <div
                  v-for="(node, index) in selectedRecord.nodes"
                  :key="index"
                  class="node-item"
                >
                  <div class="node-header">
                    <span class="node-name">{{ node.node_name }}</span>
                    <span class="node-time">{{ formatTime(node.create_time) }}</span>
                  </div>
                  <div class="node-content">
                    <div class="node-input">
                      <strong>输入:</strong>
                      <pre>{{ formatNodeData(node.input) }}</pre>
                    </div>
                    <div class="node-output">
                      <strong>输出:</strong>
                      <pre>{{ formatNodeData(node.output) }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

// 响应式数据
const historyList = ref([]);
const loading = ref(false);
const showDetailModal = ref(false);
const selectedRecord = ref(null);

const filters = ref({
  status: '',
  sortBy: 'create_time',
  search: ''
});

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
});

// 生命周期
onMounted(() => {
  loadHistory();
});

// 方法
const loadHistory = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    // 构建查询参数
    const params = new URLSearchParams({
      agentId: '3', // IP活化引擎的agent_id
      page: pagination.value.page,
      limit: pagination.value.limit
    });

    if (filters.value.status) {
      params.append('status', filters.value.status);
    }

    const response = await fetch(`/api/agents/history?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('获取历史记录失败');
    }

    const data = await response.json();
    if (data.success) {
      historyList.value = data.data;
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
    alert('加载历史记录失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const viewDetails = async (record) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/agents/history/${record.run_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('获取详情失败');
    }

    const data = await response.json();
    if (data.success) {
      selectedRecord.value = data.data;
      showDetailModal.value = true;
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    alert('获取详情失败: ' + error.message);
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedRecord.value = null;
};

const downloadResults = (record) => {
  // 实现下载功能
  alert('下载功能开发中...');
};

const deleteRecord = async (record) => {
  if (!confirm('确定要删除这条记录吗？此操作不可撤销。')) {
    return;
  }
  
  // 实现删除功能
  alert('删除功能开发中...');
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.pages) {
    pagination.value.page = page;
    loadHistory();
  }
};

const getPageNumbers = () => {
  const current = pagination.value.page;
  const total = pagination.value.pages;
  const pages = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
  }
  
  return pages;
};

// 搜索防抖
let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadHistory();
  }, 500);
};

// 工具函数
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatFullDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

const getStatusText = (status) => {
  const statusMap = {
    'running': '运行中',
    'completed': '已完成',
    'failed': '失败',
    'paused': '已暂停'
  };
  return statusMap[status] || status;
};

const getWorkflowDisplayName = (agentName) => {
  if (agentName.includes('活化')) return 'IP活化引擎';
  if (agentName.includes('叙事')) return '叙事引擎';
  if (agentName.includes('洞察')) return '洞察引擎';
  return agentName;
};

const getFormatText = (record) => {
  // 根据记录判断输出格式
  if (record.node_count > 0) {
    return 'mixed'; // 混合格式，可以根据实际情况调整
  }
  return 'unknown';
};

const formatNodeData = (data) => {
  if (typeof data === 'string') {
    return data.length > 200 ? data.slice(0, 200) + '...' : data;
  }
  return JSON.stringify(data, null, 2);
};
</script>

<style scoped>
.history-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 24px;
}

.filter-section {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #666;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.search-group {
  display: flex;
  gap: 8px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.search-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.history-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #dee2e6;
}

.history-table td {
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.project-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-icon {
  font-size: 20px;
}

.project-details {
  flex: 1;
}

.project-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.project-desc {
  font-size: 12px;
  color: #666;
}

.workflow-name {
  color: #007bff;
  font-weight: 500;
}

.related-ip {
  color: #666;
}

.time-info .date {
  font-weight: 500;
  color: #333;
}

.time-info .time {
  font-size: 12px;
  color: #666;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.running {
  background: #fff3cd;
  color: #856404;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
}

.format-tag {
  padding: 2px 6px;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 11px;
  color: #495057;
}

.format-tag.empty {
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  text-decoration: none;
}

.view-btn {
  background: #007bff;
  color: white;
}

.download-btn {
  background: #28a745;
  color: white;
}

.download-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-num {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.page-num.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.basic-info {
  margin-bottom: 30px;
}

.basic-info h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  display: flex;
  gap: 10px;
}

.info-item label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.nodes-info h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.node-item {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 15px;
  overflow: hidden;
}

.node-header {
  background: #f8f9fa;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-name {
  font-weight: 500;
  color: #333;
}

.node-time {
  font-size: 12px;
  color: #666;
}

.node-content {
  padding: 15px;
}

.node-input, .node-output {
  margin-bottom: 15px;
}

.node-input:last-child, .node-output:last-child {
  margin-bottom: 0;
}

.node-content pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 5px 0 0 0;
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .pagination-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .history-table {
    font-size: 14px;
  }
  
  .history-table th,
  .history-table td {
    padding: 10px;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>