# 温书链数据库设计文档

## 设计概述

本数据库设计专门针对大用户量的SaaS应用，包含完整的用户系统、订阅管理、云存储、项目管理功能。设计遵循以下原则：

1. **高性能**：合理的索引设计，支持大并发访问
2. **可扩展**：模块化设计，便于后续功能扩展
3. **安全性**：完善的外键约束和数据完整性保护
4. **监控友好**：完善的统计表，便于系统监控和分析

## 表结构说明

### 1. 订阅套餐表 (`wensoul_subscription_plans`)
**用途**：定义不同的订阅档位和对应的配额限制

**关键字段**：
- `plan_code`：套餐代码（FREE/BASIC/PRO/ENTERPRISE）
- `storage_quota`：云存储配额（字节）
- `asset_limit`：资产数量限制
- `generation_limit_daily/monthly`：生成次数限制
- `features`：功能特性（JSON格式）

**设计亮点**：
- 使用JSON字段存储灵活的功能特性配置
- 支持-1表示无限制，适应企业级需求

### 2. 用户表 (`wensoul_user`)
**用途**：核心用户信息存储

**修改说明**：
- 移除了原有的 `subscription_level` 和 `subscription_expire_time`
- 新增 `current_plan_id` 关联套餐表，设计更加规范

### 3. 用户订阅表 (`wensoul_user_subscriptions`)
**用途**：记录用户的订阅历史和状态

**关键功能**：
- 支持订阅历史追踪
- 自动续费管理
- 多种支付方式支持
- 完整的订阅生命周期管理

### 4. 用户云存储相关表

#### 4.1 用户存储表 (`wensoul_user_storage`)
- 使用虚拟计算列 `available_space` 实时计算可用空间
- 支持最后同步时间，便于分布式存储同步

#### 4.2 云存储文件表 (`wensoul_user_storage_files`)
**设计亮点**：
- `file_hash` 字段支持文件去重
- `storage_provider` 支持多云存储
- `metadata` JSON字段存储文件元数据
- 软删除设计（`deleted_at`）

### 5. 用户资产管理相关表

#### 5.1 用户资产表 (`wensoul_user_assets`)
**功能完备**：
- 资产状态管理（正常/暂停/完成/删除）
- 可见性控制（私有/公开）
- 存储使用统计
- 收藏功能
- 资产标签和设置（JSON格式）

**设计理念**：
- 从"项目"概念转变为"资产"概念，更符合用户上传和管理数字资源的场景
- 支持多种资产类型（document/design/data/media等）

#### 5.2 资产生成记录表 (`wensoul_asset_generations`)
**详细记录**：
- 生成类型分类（text/image/audio/video/code/other）
- 生成标签（洞察、生成、活化）- 记录AI生成的三个关键阶段
- 输入输出数据（JSON格式）
- 生成文件信息（存储路径、文件格式、文件大小）
- 性能指标（处理时间、token消耗）
- 质量评分和用户评价

**新增字段**：
- `file_path` - 生成文件存储路径
- `file_format` - 生成文件格式
- `file_size` - 生成文件大小（字节）



### 6. 使用统计和配额管理

#### 6.1 用户使用统计表（日/月级别）
**大数据设计**：
- 分离日统计和月统计，优化查询性能
- 关键指标全覆盖（生成、存储、API调用等）
- 便于数据分析和用户行为分析

#### 6.2 用户配额限制表 (`wensoul_user_quota_limits`)
**实时限流**：
- 日/月配额实时统计
- 自动重置机制
- 支持无限制用户

#### 6.3 系统使用统计表 (`wensoul_system_usage_stats`)
**系统监控**：
- 全局系统负载监控
- 性能指标追踪
- 便于容量规划

## 索引设计

### 主要索引策略：
1. **用户相关查询**：`user_id` 字段普遍建立索引
2. **时间范围查询**：`create_time`, `date`, `year_month` 建立索引
3. **状态过滤**：`status`, `project_status` 等状态字段建立索引
4. **业务查询**：`file_hash`, `plan_code` 等业务关键字段建立唯一索引

## 大用户量优化策略

### 1. 分区建议
```sql
-- 按月分区用户使用统计表
ALTER TABLE wensoul_user_usage_daily PARTITION BY RANGE (TO_DAYS(date)) (
    PARTITION p202401 VALUES LESS THAN (TO_DAYS('2024-02-01')),
    PARTITION p202402 VALUES LESS THAN (TO_DAYS('2024-03-01')),
    ...
);
```

### 2. 读写分离
- 统计查询可以使用只读从库
- 热点数据考虑Redis缓存

### 3. 数据归档
- 定期归档历史生成记录
- 统计数据按需保留（如保留2年）

### 4. 缓存策略
```sql
-- 建议缓存的数据
- 用户当前套餐信息
- 用户配额使用情况
- 热门项目信息
```

## 视图设计

### 1. 用户当前套餐视图 (`v_user_current_plan`)
简化用户套餐信息查询，一次性获取用户和套餐的完整信息。

### 2. 用户存储汇总视图 (`v_user_storage_summary`)
提供用户存储使用情况的完整视图，包含使用率计算。

### 3. 用户资产统计视图 (`v_user_asset_stats`)
汇总用户的资产相关统计信息，包括：
- 资产总数、活跃资产数、已完成资产数
- 收藏资产数
- 资产总存储使用量
- 生成记录统计（从生成记录表计算）

## 数据安全考虑

1. **敏感数据**：密码字段使用加密存储
2. **软删除**：重要数据使用软删除机制
3. **外键约束**：严格的引用完整性
4. **权限控制**：多层次的访问权限设计

## 扩展性考虑

1. **JSON字段**：灵活存储配置和元数据
2. **模块化设计**：各功能模块相对独立
3. **版本兼容**：字段设计考虑向后兼容
4. **国际化**：支持多语言扩展

## 使用建议

1. **初始化**：执行 `init_all_tables.sql` 进行完整初始化
2. **监控**：定期检查 `wensoul_system_usage_stats` 表的系统负载
3. **清理**：定期清理软删除的数据和历史统计数据
4. **备份**：重点关注用户数据和订阅信息的备份

## 性能调优建议

1. **定期优化**：`ANALYZE TABLE` 更新表统计信息
2. **索引监控**：通过 `EXPLAIN` 分析慢查询
3. **分页查询**：大数据量查询使用合适的分页策略
4. **连接池**：使用连接池管理数据库连接

这个设计可以很好地支持从几千到几百万用户的规模扩展。

## 📁 文件结构
```
database/
├── wensoul_subscription_plans.sql      # 订阅套餐表
├── wensoul_user_subscriptions.sql     # 用户订阅记录表
├── wensoul_user_storage.sql           # 云存储相关表
├── wensoul_user_assets.sql            # 用户资产管理相关表  
├── wensoul_user_usage_stats.sql       # 使用统计和配额表
├── wensoul_user.sql                   # 用户表（已更新）
├── wensoul_agent.sql                  # 代理表
├── wensoul_user_agent.sql             # 用户代理关联表
├── init_all_tables.sql                # 完整初始化脚本
└── README.md                          # 详细设计文档
``` 