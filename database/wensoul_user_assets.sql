SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户上传资产表
DROP TABLE IF EXISTS `wensoul_user_assets`;
CREATE TABLE `wensoul_user_assets` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '资产ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `asset_name` varchar(100) NOT NULL COMMENT '资产名称',
  `asset_description` text COMMENT '资产描述',
  `asset_type` varchar(50) DEFAULT NULL COMMENT '资产类型',
  `asset_status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '资产状态（0-已删除，1-正常，2-暂停，3-完成）',
  `visibility` tinyint(4) NOT NULL DEFAULT 0 COMMENT '可见性（0-私有，1-公开）',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '资产封面图片',
  `settings` json DEFAULT NULL COMMENT '资产设置（JSON格式）',
  `tags` json DEFAULT NULL COMMENT '资产标签',
  `storage_used` bigint(20) NOT NULL DEFAULT 0 COMMENT '资产占用存储空间（字节）',

  `is_favorite` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否收藏（0-否，1-是）',

  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_asset_status` (`asset_status`),
  KEY `idx_asset_type` (`asset_type`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_is_favorite` (`is_favorite`),
  CONSTRAINT `fk_wensoul_user_assets_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户上传资产表';

-- 资产生成记录表
DROP TABLE IF EXISTS `wensoul_asset_generations`;
CREATE TABLE `wensoul_asset_generations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '生成记录ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `asset_id` bigint(20) NOT NULL COMMENT '资产ID',
  `generation_type` varchar(50) NOT NULL COMMENT '生成类型（text/image/audio/video/code/other）',
  `generation_tags` json DEFAULT NULL COMMENT '生成标签（洞察、生成、活化）',
  `input_data` json DEFAULT NULL COMMENT '输入数据（JSON格式）',
  `output_data` json DEFAULT NULL COMMENT '输出数据（JSON格式）',
  `parameters` json DEFAULT NULL COMMENT '生成参数（JSON格式）',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '生成状态（0-等待中，1-生成中，2-成功，3-失败）',
  `processing_time` int(11) DEFAULT NULL COMMENT '处理时间（毫秒）',
  `tokens_used` int(11) DEFAULT NULL COMMENT '使用的token数量',
  `file_path` varchar(1000) DEFAULT NULL COMMENT '生成文件存储路径',
  `file_format` varchar(50) DEFAULT NULL COMMENT '生成文件格式',
  `file_size` bigint(20) DEFAULT NULL COMMENT '生成文件大小（字节）',
  `quality_score` decimal(3,2) DEFAULT NULL COMMENT '生成质量评分（0-1）',
  `user_rating` tinyint(4) DEFAULT NULL COMMENT '用户评分（1-5）',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否公开分享（0-否，1-是）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_status` (`status`),
  KEY `idx_generation_type` (`generation_type`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_wensoul_asset_generations_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wensoul_asset_generations_asset_id` FOREIGN KEY (`asset_id`) REFERENCES `wensoul_user_assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产生成记录表';



-- 插入示例资产数据
INSERT INTO `wensoul_user_assets` (`user_id`, `asset_name`, `asset_description`, `asset_type`, `asset_status`, `visibility`, `storage_used`) VALUES 
(1, '我的第一个资产', '这是我的第一个测试资产', 'document', 1, 0, 52428800),
(1, '设计素材库', '移动应用设计相关素材', 'design', 1, 1, 104857600),
(2, '数据分析资料', '用于数据分析的资源文件', 'data', 1, 0, 26214400);

SET FOREIGN_KEY_CHECKS = 1; 