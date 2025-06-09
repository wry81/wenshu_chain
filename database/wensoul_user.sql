SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `wensoul_user`;
CREATE TABLE `wensoul_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码（加密后）',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `current_plan_id` int(11) DEFAULT 1 COMMENT '当前套餐ID（关联subscription_plans表）',
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
SET FOREIGN_KEY_CHECKS = 1;