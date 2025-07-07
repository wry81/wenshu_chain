SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
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

-- 插入模拟数据
INSERT INTO `wensoul_user_agent` (`user_id`, `agent_id`, `subscription_duration`, `subscription_expire_time`) VALUES 
(3, 1, 1000, DATE_ADD(NOW(), INTERVAL 1000 DAY)),
(3, 2, 1000, DATE_ADD(NOW(), INTERVAL 1000 DAY)),
(3, 3, 1000, DATE_ADD(NOW(), INTERVAL 1000 DAY)),

SET FOREIGN_KEY_CHECKS = 1;