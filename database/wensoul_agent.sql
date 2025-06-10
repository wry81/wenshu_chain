SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `wensoul_agent`;
CREATE TABLE `wensoul_agent` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '智能体ID',
  `agent_name` varchar(100) NOT NULL COMMENT '智能体名称',
  `agent_description` text COMMENT '智能体简介',
  `agent_api` varchar(255) NOT NULL COMMENT '智能体API接口地址',
  `workflow` json DEFAULT NULL COMMENT '工作流配置(JSON)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` tinyint(4) DEFAULT 1 COMMENT '状态（0-禁用，1-启用）',
  `agent_image` varchar(255) COMMENT '智能体图片',
  PRIMARY KEY (`id`),
  KEY `idx_agent_name` (`agent_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体信息表';

-- 插入模拟数据
INSERT INTO `wensoul_agent` (`agent_name`, `agent_description`, `agent_api`, `workflow`) VALUES
('市场趋势分析', '结合多模型进行市场数据与趋势分析', 'http://localhost:3000/api/agents/1/run', '[{"type":"llm","model":"gpt-3.5-turbo"}]'),
('爆款文案助手', '生成吸引人的营销文案', 'http://localhost:3000/api/agents/2/run', '[{"type":"llm","model":"gpt-3.5-turbo"}]'),
('概念产品生成', '从文本到3D模型的完整概念设计流程', 'http://localhost:3000/api/agents/3/run', '[{"type":"llm","model":"gpt-3.5-turbo"},{"type":"http","apiUrl":"https://api.example.com/image"},{"type":"http","apiUrl":"https://api.example.com/model"}]');
SET FOREIGN_KEY_CHECKS = 1;