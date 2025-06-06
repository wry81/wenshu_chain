<template>
  <div class="main-container">
    <a-page-header
      title="Agent市场"
      @back="() => null"
    />
    
    <div class="engine-container">
      <a-card title="洞察引擎" class="engine-card">
        <p>这里是洞察引擎内容</p>
      </a-card>
      
      <a-card title="叙事生成引擎" class="engine-card">
        <p>这里是叙事生成引擎内容</p>
      </a-card>
      
      <a-card title="资产库" class="engine-card">
        <p>这里是资产库内容</p>
      </a-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPage'
}
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.engine-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.engine-card {
  height: 300px;
}
</style>