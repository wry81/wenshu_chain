SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 订阅套餐表
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

SET FOREIGN_KEY_CHECKS = 1; 