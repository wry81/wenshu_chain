SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for wensoul_agent_runs
-- ----------------------------
DROP TABLE IF EXISTS `wensoul_agent_runs`;
CREATE TABLE `wensoul_agent_runs` (
  `run_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '工作流运行的唯一ID',
  `user_id` BIGINT NOT NULL COMMENT '发起运行的用户ID',
  `agent_id` BIGINT NOT NULL COMMENT '正在运行的智能体ID',
  `status` VARCHAR(20) NOT NULL DEFAULT 'running' COMMENT '运行状态 (如: running, paused, completed, failed)',
  `current_node_id` VARCHAR(100) DEFAULT NULL COMMENT '当前激活或最后完成的节点ID',
  `node_results` JSON DEFAULT NULL COMMENT '存储每个已完成节点输入和输出的JSON对象',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`run_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_agent_run_user` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_agent_run_agent` FOREIGN KEY (`agent_id`) REFERENCES `wensoul_agent` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用于追踪Agent工作流的运行实例和状态';

SET FOREIGN_KEY_CHECKS = 1;
