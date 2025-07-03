SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `wensoul_agent_run_nodes`;
CREATE TABLE `wensoul_agent_run_nodes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `run_id` BIGINT NOT NULL COMMENT '关联运行ID',
  `node_id` VARCHAR(100) NOT NULL COMMENT '节点ID',
  `node_name` VARCHAR(100) DEFAULT NULL COMMENT '节点名称',
  `node_type` VARCHAR(50) DEFAULT NULL COMMENT '节点类型',
  `input_data` JSON DEFAULT NULL COMMENT '节点输入数据',
  `output_data` JSON DEFAULT NULL COMMENT '节点输出数据',
  `output_file_id` BIGINT DEFAULT NULL COMMENT '输出文件ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_run_id` (`run_id`),
  CONSTRAINT `fk_run_node_run` FOREIGN KEY (`run_id`) REFERENCES `wensoul_agent_runs` (`run_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体运行节点记录表';

SET FOREIGN_KEY_CHECKS = 1;
