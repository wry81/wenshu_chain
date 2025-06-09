SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户订阅表
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

SET FOREIGN_KEY_CHECKS = 1; 