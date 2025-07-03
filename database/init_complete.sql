-- ============================================================================
-- 文枢链 - 完整数据库初始化脚本（包含所有表定义）
-- 适用于大用户量的用户系统、订阅管理、云存储、资产管理
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. 订阅套餐表（基础配置表，需要首先创建）
-- ============================================================================

DROP TABLE IF EXISTS `wensoul_subscription_plans`;
CREATE TABLE `wensoul_subscription_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '套餐ID',
  `plan_name` varchar(50) NOT NULL COMMENT '套餐名称',
  `plan_code` varchar(20) NOT NULL COMMENT '套餐代码',
  `description` text COMMENT '套餐描述',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格（元/月）',
  `storage_quota` bigint(20) NOT NULL DEFAULT 0 COMMENT '云存储配额（字节）',
  `asset_limit` int(11) NOT NULL DEFAULT 0 COMMENT '资产数量限制（-1表示无限制）',
  `generation_limit_daily` int(11) NOT NULL DEFAULT 0 COMMENT '每日生成次数限制（-1表示无限制）',
  `generation_limit_monthly` int(11) NOT NULL DEFAULT 0 COMMENT '每月生成次数限制（-1表示无限制）',
  `max_file_size` bigint(20) NOT NULL DEFAULT 0 COMMENT '单文件最大大小（字节）',
  `features` json COMMENT '套餐功能特性（JSON格式）',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活（0-否，1-是）',
  `sort_order` int(11) NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plan_code` (`plan_code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订阅套餐表';

-- 插入示例套餐数据
INSERT INTO `wensoul_subscription_plans` (`plan_name`, `plan_code`, `description`, `price`, `storage_quota`, `asset_limit`, `generation_limit_daily`, `generation_limit_monthly`, `max_file_size`, `features`, `sort_order`) VALUES 
('免费版', 'FREE', '适合个人用户试用', 0.00, 1073741824, 3, 10, 100, 10485760, '{"api_access": false, "priority_support": false, "advanced_features": false}', 1),
('基础版', 'BASIC', '适合个人用户', 29.90, 10737418240, 10, 50, 500, 52428800, '{"api_access": true, "priority_support": false, "advanced_features": false}', 2),
('专业版', 'PRO', '适合专业用户', 99.90, 107374182400, 50, 200, 2000, 268435456, '{"api_access": true, "priority_support": true, "advanced_features": true}', 3),
('企业版', 'ENTERPRISE', '适合企业用户', 299.90, 1099511627776, -1, -1, -1, 1073741824, '{"api_access": true, "priority_support": true, "advanced_features": true, "custom_integration": true}', 4);

-- ============================================================================
-- 2. 用户表
-- ============================================================================

DROP TABLE IF EXISTS `wensoul_user`;
CREATE TABLE `wensoul_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码（加密后）',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `current_plan_id` int(11) DEFAULT 1 COMMENT '当前套餐ID',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` tinyint(4) DEFAULT 1 COMMENT '状态（0-禁用，1-启用）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 插入示例数据
INSERT INTO `wensoul_user` (`username`, `password`, `email`, `phone`, `current_plan_id`,`status`) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKVjzieMwfcpO7E3nJfnqHJKMM/K', 'admin@example.com', '13800138000', 3, 1),
('testuser', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKVjzieMwfcpO7E3nJfnqHJKMM/K', 'test@example.com', '13900139000', 2, 1); 

-- ============================================================================
-- 3. 用户订阅记录表
-- ============================================================================

DROP TABLE IF EXISTS `wensoul_user_subscriptions`;
CREATE TABLE `wensoul_user_subscriptions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '订阅ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `plan_id` int(11) NOT NULL COMMENT '套餐ID',
  `order_id` varchar(64) DEFAULT NULL COMMENT '订单ID',
  `start_time` datetime NOT NULL COMMENT '订阅开始时间',
  `end_time` datetime NOT NULL COMMENT '订阅结束时间',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '订阅状态（0-已取消，1-活跃，2-已过期，3-暂停）',
  `auto_renew` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否自动续费（0-否，1-是）',
  `payment_method` varchar(20) DEFAULT NULL COMMENT '支付方式',
  `amount_paid` decimal(10,2) DEFAULT 0.00 COMMENT '支付金额',
  `currency` varchar(3) DEFAULT 'CNY' COMMENT '货币类型',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_plan_id` (`plan_id`),
  KEY `idx_status` (`status`),
  KEY `idx_end_time` (`end_time`),
  CONSTRAINT `fk_wensoul_user_subscriptions_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wensoul_user_subscriptions_plan_id` FOREIGN KEY (`plan_id`) REFERENCES `wensoul_subscription_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户订阅表';

-- 插入示例订阅数据
INSERT INTO `wensoul_user_subscriptions` (`user_id`, `plan_id`, `start_time`, `end_time`, `status`, `auto_renew`, `payment_method`, `amount_paid`) VALUES 
(1, 3, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 1, 1, 'alipay', 99.90),
(2, 2, '2024-01-15 00:00:00', '2024-02-14 23:59:59', 1, 0, 'wechat', 29.90);

-- ============================================================================
-- 4. 用户云存储相关表
-- ============================================================================

DROP TABLE IF EXISTS `wensoul_user_storage`;
CREATE TABLE `wensoul_user_storage` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '存储记录ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `total_quota` bigint(20) NOT NULL DEFAULT 0 COMMENT '总配额（字节）',
  `used_space` bigint(20) NOT NULL DEFAULT 0 COMMENT '已使用空间（字节）',
  `available_space` bigint(20) GENERATED ALWAYS AS (`total_quota` - `used_space`) VIRTUAL COMMENT '可用空间（字节）',
  `file_count` int(11) NOT NULL DEFAULT 0 COMMENT '文件总数',
  `last_sync_time` datetime DEFAULT NULL COMMENT '最后同步时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_used_space` (`used_space`),
  CONSTRAINT `fk_wensoul_user_storage_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户云存储表';

DROP TABLE IF EXISTS `wensoul_user_storage_files`;
CREATE TABLE `wensoul_user_storage_files` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `asset_id` bigint(20) DEFAULT NULL COMMENT '资产ID（可选）',
  `file_name` varchar(255) NOT NULL COMMENT '文件名',
  `file_path` varchar(1000) NOT NULL COMMENT '文件路径',
  `file_size` bigint(20) NOT NULL COMMENT '文件大小（字节）',
  `file_type` varchar(100) DEFAULT NULL COMMENT '文件类型',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME类型',
  `file_hash` varchar(64) DEFAULT NULL COMMENT '文件哈希值（用于去重）',
  `storage_provider` varchar(50) DEFAULT 'local' COMMENT '存储提供商（local/aliyun/aws等）',
  `storage_path` varchar(1000) DEFAULT NULL COMMENT '实际存储路径',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否公开（0-私有，1-公开）',
  `download_count` int(11) NOT NULL DEFAULT 0 COMMENT '下载次数',
  `tags` json DEFAULT NULL COMMENT '文件标签',
  `metadata` json DEFAULT NULL COMMENT '文件元数据',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '文件状态（0-已删除，1-正常，2-上传中）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_file_hash` (`file_hash`),
  KEY `idx_file_path` (`file_path`(255)),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_wensoul_user_storage_files_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='云存储文件表';

-- 插入示例存储数据
INSERT INTO `wensoul_user_storage` (`user_id`, `total_quota`, `used_space`, `file_count`) VALUES 
(1, 107374182400, 5368709120, 15),
(2, 10737418240, 1073741824, 8);

-- ============================================================================
-- 5. 用户资产管理相关表
-- ============================================================================

DROP TABLE IF EXISTS `wensoul_user_assets`;
CREATE TABLE `wensoul_user_assets` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '资产ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `asset_name` varchar(100) NOT NULL COMMENT '资产名称',
  `asset_description` text COMMENT '资产描述',
  `asset_type` varchar(50) DEFAULT NULL COMMENT '资产类型',
  `asset_status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '资产状态（0-已删除，1-正常，2-暂停，3-完成）',
  `visibility` tinyint(4) NOT NULL DEFAULT 0 COMMENT '可见性（0-私有，1-公开）',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '资产封面图片',
  `settings` json DEFAULT NULL COMMENT '资产设置（JSON格式）',
  `tags` json DEFAULT NULL COMMENT '资产标签',
  `storage_used` bigint(20) NOT NULL DEFAULT 0 COMMENT '资产占用存储空间（字节）',
  `is_favorite` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否收藏（0-否，1-是）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_asset_status` (`asset_status`),
  KEY `idx_asset_type` (`asset_type`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_is_favorite` (`is_favorite`),
  CONSTRAINT `fk_wensoul_user_assets_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户上传资产表';

DROP TABLE IF EXISTS `wensoul_asset_generations`;
CREATE TABLE `wensoul_asset_generations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '生成记录ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `asset_id` bigint(20) NOT NULL COMMENT '关联资产ID',
  `generation_type` varchar(50) NOT NULL COMMENT '生成工作流',
  `generation_tags` json DEFAULT NULL COMMENT '生成标签（洞察、生成、活化）',
  `input_data` json DEFAULT NULL COMMENT '输入数据（JSON格式）',
  `output_data` json DEFAULT NULL COMMENT '输出数据（JSON格式）',
  `parameters` json DEFAULT NULL COMMENT '生成参数（JSON格式）',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '生成状态（0-等待中，1-生成中，2-成功，3-失败）',
  `processing_time` int(11) DEFAULT NULL COMMENT '处理时间（毫秒）',
  `tokens_used` int(11) DEFAULT NULL COMMENT '使用的token数量',
  `file_path` varchar(1000) DEFAULT NULL COMMENT '生成文件存储路径',
  `file_format` varchar(50) DEFAULT NULL COMMENT '生成文件格式',
  `file_size` bigint(20) DEFAULT NULL COMMENT '生成文件大小（字节）',
  `quality_score` decimal(3,2) DEFAULT NULL COMMENT '生成质量评分（0-1）',
  `user_rating` tinyint(4) DEFAULT NULL COMMENT '用户评分（1-5）',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否公开分享（0-否，1-是）',
  `creator_name` varchar(100) DEFAULT NULL COMMENT '创建人姓名',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '封面图片',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_status` (`status`),
  KEY `idx_generation_type` (`generation_type`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_creator_name` (`creator_name`),
  CONSTRAINT `fk_wensoul_asset_generations_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wensoul_asset_generations_asset_id` FOREIGN KEY (`asset_id`) REFERENCES `wensoul_user_assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产生成记录表';

-- 插入示例资产数据
INSERT INTO `wensoul_user_assets` (`user_id`, `asset_name`, `asset_description`, `asset_type`, `asset_status`, `visibility`, `storage_used`) VALUES 
(1, '我的第一个资产', '这是我的第一个测试资产', 'document', 1, 0, 52428800),
(1, '设计素材库', '移动应用设计相关素材', 'design', 1, 1, 104857600),
(2, '数据分析资料', '用于数据分析的资源文件', 'data', 1, 0, 26214400);

-- ============================================================================
-- 6. 用户使用统计和配额管理表
-- ============================================================================

DROP TABLE IF EXISTS `wensoul_user_usage_daily`;
CREATE TABLE `wensoul_user_usage_daily` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `date` date NOT NULL COMMENT '统计日期',
  `generation_count` int(11) NOT NULL DEFAULT 0 COMMENT '当日生成次数',
  `storage_uploaded` bigint(20) NOT NULL DEFAULT 0 COMMENT '当日上传存储量（字节）',
  `storage_downloaded` bigint(20) NOT NULL DEFAULT 0 COMMENT '当日下载流量（字节）',
  `api_calls` int(11) NOT NULL DEFAULT 0 COMMENT 'API调用次数',
  `login_count` int(11) NOT NULL DEFAULT 0 COMMENT '登录次数',
  `active_assets` int(11) NOT NULL DEFAULT 0 COMMENT '活跃资产数',
  `tokens_consumed` int(11) NOT NULL DEFAULT 0 COMMENT '消耗的token数量',
  `error_count` int(11) NOT NULL DEFAULT 0 COMMENT '错误次数',
  `last_activity_time` datetime DEFAULT NULL COMMENT '最后活动时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `date`),
  KEY `idx_date` (`date`),
  KEY `idx_generation_count` (`generation_count`),
  CONSTRAINT `fk_wensoul_user_usage_daily_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户使用统计表（日级别）';

DROP TABLE IF EXISTS `wensoul_user_usage_monthly`;
CREATE TABLE `wensoul_user_usage_monthly` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `year_month` varchar(7) NOT NULL COMMENT '年月（YYYY-MM）',
  `generation_count` int(11) NOT NULL DEFAULT 0 COMMENT '当月生成次数',
  `storage_uploaded` bigint(20) NOT NULL DEFAULT 0 COMMENT '当月上传存储量（字节）',
  `storage_downloaded` bigint(20) NOT NULL DEFAULT 0 COMMENT '当月下载流量（字节）',
  `api_calls` int(11) NOT NULL DEFAULT 0 COMMENT 'API调用次数',
  `active_days` int(11) NOT NULL DEFAULT 0 COMMENT '活跃天数',
  `new_assets` int(11) NOT NULL DEFAULT 0 COMMENT '新建资产数',
  `tokens_consumed` int(11) NOT NULL DEFAULT 0 COMMENT '消耗的token数量',
  `total_cost` decimal(10,4) NOT NULL DEFAULT 0.0000 COMMENT '总成本',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_month` (`user_id`, `year_month`),
  KEY `idx_year_month` (`year_month`),
  KEY `idx_generation_count` (`generation_count`),
  CONSTRAINT `fk_wensoul_user_usage_monthly_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户使用统计表（月级别）';

DROP TABLE IF EXISTS `wensoul_user_quota_limits`;
CREATE TABLE `wensoul_user_quota_limits` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '配额ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `plan_id` int(11) NOT NULL COMMENT '套餐ID',
  `storage_quota` bigint(20) NOT NULL COMMENT '存储配额（字节）',
  `daily_generation_limit` int(11) NOT NULL COMMENT '每日生成限制',
  `monthly_generation_limit` int(11) NOT NULL COMMENT '每月生成限制',
  `daily_generation_used` int(11) NOT NULL DEFAULT 0 COMMENT '今日已使用生成次数',
  `monthly_generation_used` int(11) NOT NULL DEFAULT 0 COMMENT '本月已使用生成次数',
  `storage_used` bigint(20) NOT NULL DEFAULT 0 COMMENT '已使用存储（字节）',
  `last_reset_date` date NOT NULL COMMENT '最后重置日期',
  `last_monthly_reset` varchar(7) NOT NULL COMMENT '最后月度重置（YYYY-MM）',
  `is_unlimited` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否无限制（0-否，1-是）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_plan_id` (`plan_id`),
  KEY `idx_last_reset_date` (`last_reset_date`),
  CONSTRAINT `fk_wensoul_user_quota_limits_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wensoul_user_quota_limits_plan_id` FOREIGN KEY (`plan_id`) REFERENCES `wensoul_subscription_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户配额限制表';

DROP TABLE IF EXISTS `wensoul_system_usage_stats`;
CREATE TABLE `wensoul_system_usage_stats` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `date` date NOT NULL COMMENT '统计日期',
  `total_users` int(11) NOT NULL DEFAULT 0 COMMENT '总用户数',
  `active_users` int(11) NOT NULL DEFAULT 0 COMMENT '活跃用户数',
  `new_users` int(11) NOT NULL DEFAULT 0 COMMENT '新增用户数',
  `total_generations` int(11) NOT NULL DEFAULT 0 COMMENT '总生成次数',
  `total_storage_used` bigint(20) NOT NULL DEFAULT 0 COMMENT '总存储使用量（字节）',
  `total_bandwidth` bigint(20) NOT NULL DEFAULT 0 COMMENT '总带宽使用量（字节）',
  `avg_response_time` int(11) DEFAULT NULL COMMENT '平均响应时间（毫秒）',
  `error_rate` decimal(5,4) DEFAULT NULL COMMENT '错误率',
  `peak_concurrent_users` int(11) DEFAULT NULL COMMENT '峰值并发用户数',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_date` (`date`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统使用统计表';

-- 插入示例配额数据
INSERT INTO `wensoul_user_quota_limits` (`user_id`, `plan_id`, `storage_quota`, `daily_generation_limit`, `monthly_generation_limit`, `daily_generation_used`, `monthly_generation_used`, `storage_used`, `last_reset_date`, `last_monthly_reset`) VALUES 
(1, 3, 107374182400, 200, 2000, 15, 145, 5368709120, CURDATE(), DATE_FORMAT(NOW(), '%Y-%m')),
(2, 2, 10737418240, 50, 500, 8, 78, 1073741824, CURDATE(), DATE_FORMAT(NOW(), '%Y-%m'));

-- ============================================================================
-- 7. 代理相关表
-- ============================================================================

DROP TABLE IF EXISTS `wensoul_agent`;
CREATE TABLE `wensoul_agent` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '智能体ID',
  `agent_name` varchar(100) NOT NULL COMMENT '智能体名称',
  `agent_description` text COMMENT '智能体简介',
  `workflow` json DEFAULT NULL COMMENT '工作流节点配置(JSON数组),定义了agent的执行步骤',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` tinyint(4) DEFAULT 1 COMMENT '状态（0-禁用，1-启用）',
  `agent_image` varchar(255) COMMENT '智能体图片',
  PRIMARY KEY (`id`),
  KEY `idx_agent_name` (`agent_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体信息表';

DROP TABLE IF EXISTS `wensoul_user_agent`;
CREATE TABLE `wensoul_user_agent` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '订阅记录ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `agent_id` bigint(20) NOT NULL COMMENT '智能体ID',
  `subscription_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '订阅时间',
  `subscription_duration` int(11) NOT NULL COMMENT '订阅时长（天数）',
  `subscription_expire_time` datetime NOT NULL COMMENT '订阅到期时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` tinyint(4) DEFAULT 1 COMMENT '订阅状态（0-已取消，1-生效中，2-已过期）',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_user_agent` (`user_id`, `agent_id`),
  KEY `idx_expire_time` (`subscription_expire_time`),
  CONSTRAINT `fk_subscription_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subscription_agent_id` FOREIGN KEY (`agent_id`) REFERENCES `wensoul_agent` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户订阅智能体表';

-- 插入使用新工作流结构的模拟数据
INSERT INTO `wensoul_agent` (`agent_name`, `agent_description`, `workflow`) VALUES
('市场趋势分析', '结合多模型进行市场数据与趋势分析', '[
  {
    "nodeId": "step1_analyze_market",
    "nodeName": "分析市场数据",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "请根据以下市场信息，分析其主要趋势、机遇和挑战：\\n\\n{{input}}"
  }
]'),
('爆款文案助手', '生成吸引人的营销文案', '[
  {
    "nodeId": "step1_generate_copy",
    "nodeName": "生成营销文案",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "为一款产品或服务(产品信息:{{input}})生成五条不同风格的爆款营销文案。"
  }
]'),
('概念产品生成', '从文本到3D模型的完整概念设计流程', '[
  {
    "nodeId": "step1_refine_concept",
    "nodeName": "提炼核心设计元素",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "根据以下产品创意({{input}}), 提炼出5-7个核心视觉设计关键词, 用于后续的图像生成。"
  },
  {
    "nodeId": "step2_generate_images",
    "nodeName": "生成概念图",
    "nodeType": "text-to-image",
    "model": "unicom_t2i",
    "promptTemplate": "A high-detail concept art of a product based on the following elements: {{input}}"
  },
  {
    "nodeId": "step3_generate_model",
    "nodeName": "生成3D模型",
    "nodeType": "image-to-model",
    "model": "internal-3d-generator-v2",
    "promptTemplate": ""
  }
]');

--  agents运行节点
DROP TABLE IF EXISTS `wensoul_agent_runs`;
CREATE TABLE `wensoul_agent_runs` (
  `run_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '工作流运行的唯一ID',
  `user_id` BIGINT NOT NULL COMMENT '发起运行的用户ID',
  `agent_id` BIGINT NOT NULL COMMENT '正在运行的智能体ID',
  `run_name` VARCHAR(255) DEFAULT NULL COMMENT '运行名称',
  `status` VARCHAR(20) NOT NULL DEFAULT 'running' COMMENT '运行状态 (如: running, paused, completed, failed)',
  `run_name` VARCHAR(255) DEFAULT NULL COMMENT '运行名称',
  `workflow_snapshot` JSON DEFAULT NULL COMMENT '当次运行的工作流快照',
  `current_node_id` VARCHAR(100) DEFAULT NULL COMMENT '当前激活或最后完成的节点ID',
  `node_results` JSON DEFAULT NULL COMMENT '存储每个已完成节点输入和输出的JSON对象',
  `workflow_snapshot` JSON DEFAULT NULL COMMENT '执行时的工作流快照',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`run_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_agent_run_user` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_agent_run_agent` FOREIGN KEY (`agent_id`) REFERENCES `wensoul_agent` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用于追踪Agent工作流的运行实例和状态';

DROP TABLE IF EXISTS `wensoul_agent_run_nodes`;
CREATE TABLE `wensoul_agent_run_nodes` (

  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '运行节点ID',
  `run_id` BIGINT NOT NULL COMMENT '关联的运行ID',
  `node_id` VARCHAR(100) NOT NULL COMMENT '节点ID',
  `node_name` VARCHAR(255) DEFAULT NULL COMMENT '节点名称',
  `input` JSON DEFAULT NULL COMMENT '节点输入',
  `output` JSON DEFAULT NULL COMMENT '节点输出',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_run_id` (`run_id`),
  CONSTRAINT `fk_run_nodes_run` FOREIGN KEY (`run_id`) REFERENCES `wensoul_agent_runs`(`run_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='记录Agent运行的各节点输入输出';
-- ============================================================================
-- 创建视图
-- ============================================================================

-- 用户当前套餐信息视图
CREATE OR REPLACE VIEW `v_user_current_plan` AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    sp.plan_name,
    sp.plan_code,
    sp.storage_quota,
    sp.asset_limit,
    sp.generation_limit_daily,
    sp.generation_limit_monthly,
    us.end_time as subscription_end_time,
    us.status as subscription_status,
    us.auto_renew
FROM wensoul_user u
LEFT JOIN wensoul_subscription_plans sp ON u.current_plan_id = sp.id
LEFT JOIN wensoul_user_subscriptions us ON u.id = us.user_id AND us.status = 1 
    AND us.end_time > NOW()
ORDER BY us.end_time DESC
LIMIT 1;

-- 用户存储使用情况视图
CREATE OR REPLACE VIEW `v_user_storage_summary` AS
SELECT 
    u.id as user_id,
    u.username,
    COALESCE(us.total_quota, 0) as total_quota,
    COALESCE(us.used_space, 0) as used_space,
    COALESCE(us.available_space, us.total_quota) as available_space,
    COALESCE(us.file_count, 0) as file_count,
    ROUND(COALESCE(us.used_space, 0) / COALESCE(NULLIF(us.total_quota, 0), 1) * 100, 2) as usage_percentage
FROM wensoul_user u
LEFT JOIN wensoul_user_storage us ON u.id = us.user_id
WHERE u.status = 1;

-- 用户资产统计视图
CREATE OR REPLACE VIEW `v_user_asset_stats` AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(a.id) as total_assets,
    COUNT(CASE WHEN a.asset_status = 1 THEN 1 END) as active_assets,
    COUNT(CASE WHEN a.asset_status = 3 THEN 1 END) as completed_assets,
    SUM(COALESCE(a.storage_used, 0)) as total_asset_storage,
    COUNT(CASE WHEN a.is_favorite = 1 THEN 1 END) as favorite_assets,
    (SELECT COUNT(*) FROM wensoul_asset_generations g WHERE g.user_id = u.id) as total_generations,
    (SELECT MAX(g.create_time) FROM wensoul_asset_generations g WHERE g.user_id = u.id) as last_generation_time
FROM wensoul_user u
LEFT JOIN wensoul_user_assets a ON u.id = a.user_id AND a.asset_status != 0
GROUP BY u.id, u.username;

-- ============================================================================
-- 初始化完成
-- ============================================================================
SELECT '文枢链数据库初始化完成！' as status, NOW() as completed_at, '所有表和视图已创建' as message; 
