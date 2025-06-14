SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `wensoul_agent`;
CREATE TABLE `wensoul_agent` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '智能体ID',
  `agent_name` varchar(100) NOT NULL COMMENT '智能体名称',
  `agent_description` text COMMENT '智能体简介',
  `workflow` json DEFAULT NULL COMMENT '工作流节点配置(JSON数组),定义了agent的执行步骤',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` tinyint(4) DEFAULT 1 COMMENT '状态（0-禁用，1-启用）',
  `agent_image` varchar(255) COMMENT '智能体图片',
  PRIMARY KEY (`id`),
  KEY `idx_agent_name` (`agent_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体信息表';

-- 插入使用新工作流结构的模拟数据
-- 需要更改model
INSERT INTO `wensoul_agent` (`agent_name`, `agent_description`, `workflow`) VALUES
('市场趋势分析', '结合多模型进行市场数据与趋势分析', '[
  {
    "nodeId": "step1_analyze_market",
    "nodeName": "分析市场数据",
    "nodeType": "text-to-text",
    "model": "deepseek-v3", 
    "promptTemplate": "请根据以下市场信息，分析其主要趋势、机遇和挑战：\n\n{{input}}"
  }
]'),
('爆款文案助手', '生成吸引人的营销文案', '[
  {
    "nodeId": "step1_generate_copy",
    "nodeName": "生成营销文案",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "为一款产品或服务（产品信息：{{input}}）生成五条不同风格的爆款营销文案。"
  }
]'),
('概念产品生成', '从文本到3D模型的完整概念设计流程', '[
  {
    "nodeId": "step1_refine_concept",
    "nodeName": "提炼核心设计元素",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "根据以下产品创意（{{input}}），提炼出5-7个核心视觉设计关键词，用于后续的图像生成。"
  },
  {
    "nodeId": "step2_generate_images",
    "nodeName": "生成概念图",
    "nodeType": "text-to-image",
    "model": "unicom_t2i",
    "promptTemplate": "A high-detail concept art of a product based on the following elements: {{input}}"
  },
  {
    "nodeId": "step3_generate_model",
    "nodeName": "生成3D模型",
    "nodeType": "image-to-model",
    "model": "internal-3d-generator-v2",
    "promptTemplate": ""
  },
  
]');
SET FOREIGN_KEY_CHECKS = 1;