SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户云存储表
DROP TABLE IF EXISTS `wensoul_user_storage`;
CREATE TABLE `wensoul_user_storage` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '存储记录ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `total_quota` bigint(20) NOT NULL DEFAULT 0 COMMENT '总配额（字节）',
  `used_space` bigint(20) NOT NULL DEFAULT 0 COMMENT '已使用空间（字节）',
  `available_space` bigint(20) GENERATED ALWAYS AS (`total_quota` - `used_space`) VIRTUAL COMMENT '可用空间（字节）',
  `file_count` int(11) NOT NULL DEFAULT 0 COMMENT '文件总数',
  `last_sync_time` datetime DEFAULT NULL COMMENT '最后同步时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_used_space` (`used_space`),
  CONSTRAINT `fk_wensoul_user_storage_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户云存储表';

-- 云存储文件表
DROP TABLE IF EXISTS `wensoul_user_storage_files`;
CREATE TABLE `wensoul_user_storage_files` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `asset_id` bigint(20) DEFAULT NULL COMMENT '资产ID（可选）',
  `file_name` varchar(255) NOT NULL COMMENT '文件名',
  `file_path` varchar(1000) NOT NULL COMMENT '文件路径',
  `file_size` bigint(20) NOT NULL COMMENT '文件大小（字节）',
  `file_type` varchar(100) DEFAULT NULL COMMENT '文件类型',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME类型',
  `file_hash` varchar(64) DEFAULT NULL COMMENT '文件哈希值（用于去重）',
  `storage_provider` varchar(50) DEFAULT 'local' COMMENT '存储提供商（local/aliyun/aws等）',
  `storage_path` varchar(1000) DEFAULT NULL COMMENT '实际存储路径',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否公开（0-私有，1-公开）',
  `download_count` int(11) NOT NULL DEFAULT 0 COMMENT '下载次数',
  `tags` json DEFAULT NULL COMMENT '文件标签',
  `metadata` json DEFAULT NULL COMMENT '文件元数据',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '文件状态（0-已删除，1-正常，2-上传中）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_file_hash` (`file_hash`),
  KEY `idx_file_path` (`file_path`(255)),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_wensoul_user_storage_files_user_id` FOREIGN KEY (`user_id`) REFERENCES `wensoul_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='云存储文件表';

-- 插入示例存储数据
INSERT INTO `wensoul_user_storage` (`user_id`, `total_quota`, `used_space`, `file_count`) VALUES 
(1, 107374182400, 5368709120, 15),
(2, 10737418240, 1073741824, 8);

SET FOREIGN_KEY_CHECKS = 1; 