SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
SET FOREIGN_KEY_CHECKS = 1;
