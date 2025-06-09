SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户使用统计表（日级别）
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

-- 用户使用统计表（月级别）
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

-- 用户配额限制表（实时）
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

-- 系统使用统计表（用于监控整体系统负载）
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

SET FOREIGN_KEY_CHECKS = 1; 