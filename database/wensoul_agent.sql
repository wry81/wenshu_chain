SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `wensoul_agent`;
CREATE TABLE `wensoul_agent` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '智能体ID',
  `agent_name` varchar(100) NOT NULL COMMENT '智能体名称',
  `agent_description` text COMMENT '智能体简介',
  `agent_api` varchar(255) NOT NULL COMMENT '智能体API接口地址',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` tinyint(4) DEFAULT 1 COMMENT '状态（0-禁用，1-启用）',
  `agent_image` varchar(255) COMMENT '智能体图片',
  PRIMARY KEY (`id`),
  KEY `idx_agent_name` (`agent_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体信息表';

-- 插入模拟数据
INSERT INTO `wensoul_agent` (`agent_name`, `agent_description`, `agent_api`) VALUES 
('文档分析师', '专业的文档分析智能体，擅长处理和分析各类文档内容', 'https://api.example.com/document-analyzer'),
('代码助手', '专业的编程助手，能够帮助编写、调试和优化代码', 'https://api.example.com/code-assistant'),
('数据分析师', '专业的数据分析智能体，擅长数据处理和可视化分析', 'https://api.example.com/data-analyst'); 
SET FOREIGN_KEY_CHECKS = 1;