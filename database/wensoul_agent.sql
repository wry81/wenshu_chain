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
('智能市场分析引擎','基于市场数据分析的全流程智能分析系统','[
  {
    "nodeId": "step1_analyze_market",
    "nodeName": "分析市场数据",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "请根据以下市场信息，分析其主要趋势、机遇和挑战：\\n\\n{{input}}"
  },
  {
    "nodeId": "step2_social_analysis",
    "nodeName": "社媒热点分析",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "基于当前市场分析，进行社交媒体热点词汇抓取与分析：\\n\\n{{input}}"
  },
  {
    "nodeId": "step3_competitor_research",
    "nodeName": "竞品调研",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "结合市场和社媒分析，对竞争对手进行深度调研分析：\\n\\n{{input}}"
  },
  {
    "nodeId": "step4_challenge_opportunity",
    "nodeName": "现状挑战与机遇",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "基于前述分析，总结当前市场的主要挑战与机遇：\\n\\n{{input}}"
  },
  {
    "nodeId": "step5_doc_generation",
    "nodeName": "文档生成",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "综合以上所有分析结果，生成完整的市场分析报告：\\n\\n{{input}}"
  }
]'),
('叙事引擎','基于文化元素分析的文旅 IP 全流程叙事生成','[
  {
    "nodeId": "step1_culture_analysis",
    "nodeName": "文化元素分析",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "请对以下文化元素进行详细分析：\\n\\n{{input}}"
  },
  {
    "nodeId": "step2_ip_generation",
    "nodeName": "文旅IP生成",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "依据分析结果，为文旅项目生成一个具有吸引力的 IP 概念，包括核心故事与特色亮点：\\n\\n{{input}}"
  },
  {
    "nodeId": "step3_ip_setting",
    "nodeName": "IP设定构建",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "根据以下 IP 概念，为其构建完整设定（世界观、角色、历史、象征意义等）：\\n\\n{{input}}"
  },
  {
    "nodeId": "step4_ip_image_iter",
    "nodeName": "IP形象迭代",
    "nodeType": "text-to-image",
    "model": "unicom_t2i",
    "promptTemplate": "A refined concept art of a cultural-tourism IP character based on the following description: {{input}}"
  },
  {
    "nodeId": "step5_doc_generation",
    "nodeName": "文档生成",
    "nodeType": "text-to-text",
    "model": "deepseek-v3",
    "promptTemplate": "综合以上内容，为该 IP 生成完整策划说明文档（含背景故事、形象说明、应用场景等）：\\n\\n{{input}}"
  }
  ]'),
('文旅IP多模态创作','融合图文问答、视觉原型、动态表情包及场景化延展的 IP 创作流程','[
  {
    "nodeId": "step1_decompose",
    "nodeName": "IP元素解构",
    "nodeType": "multi-to-text",
    "model": "unicomiqa40B",
    "promptTemplate": "深度分析现有 IP 的核心要素与市场定位，提取 DNA 级特征标签：\\n\\n{{input}}"
  },
  {
    "nodeId": "step2_visual_prototype",
    "nodeName": "视觉原型生成",
    "nodeType": "text-to-image",
    "model": "unicom_t2i",
    "promptTemplate": "请输入想要生成的文旅 IP 视觉原型风格：\\n\\n{{input}}"
  },
  {
    "nodeId": "step3_dynamic_emojis",
    "nodeName": "动态表情包创作",
    "nodeType": "text-to-video",
    "model": "unicom_i2v",
    "promptTemplate": "将静态形象转化为系列表情动画，自动生成眨眼、口型等基础动作视频：\\n\\n{{input}}"
  },
  {
    "nodeId": "step4_scenario_extension",
    "nodeName": "场景化延展",
    "nodeType": "text-to-image",
    "model": "unicom_t2i",
    "promptTemplate": "生成 IP 在不同场景的应用效果图：周边产品/海报/社交媒体模板等：\\n\\n{{input}}"
  }
]');

SET FOREIGN_KEY_CHECKS = 1;