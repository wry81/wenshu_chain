-- ============================================================================
-- 温书链 - 完整数据库初始化脚本
-- 适用于大用户量的用户系统、订阅管理、云存储、项目管理
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. 订阅套餐表（基础配置表，需要首先创建）
-- ============================================================================
SOURCE wensoul_subscription_plans.sql;

-- ============================================================================
-- 2. 用户表（更新后的版本，关联套餐表）
-- ============================================================================
SOURCE wensoul_user.sql;

-- ============================================================================
-- 3. 用户订阅记录表
-- ============================================================================
SOURCE wensoul_user_subscriptions.sql;

-- ============================================================================
-- 4. 用户云存储相关表
-- ============================================================================
SOURCE wensoul_user_storage.sql;

-- ============================================================================
-- 5. 用户资产管理相关表
-- ============================================================================
SOURCE wensoul_user_assets.sql;

-- ============================================================================
-- 6. 用户使用统计和配额管理表
-- ============================================================================
SOURCE wensoul_user_usage_stats.sql;

-- ============================================================================
-- 7. 代理相关表（保持原有功能）
-- ============================================================================
SOURCE wensoul_agent.sql;
SOURCE wensoul_user_agent.sql;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 创建一些常用的视图和存储过程
-- ============================================================================

-- 用户当前套餐信息视图
CREATE OR REPLACE VIEW `v_user_current_plan` AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    sp.plan_name,
    sp.plan_code,
    sp.storage_quota,
    sp.asset_limit,
    sp.generation_limit_daily,
    sp.generation_limit_monthly,
    us.end_time as subscription_end_time,
    us.status as subscription_status,
    us.auto_renew
FROM wensoul_user u
LEFT JOIN wensoul_subscription_plans sp ON u.current_plan_id = sp.id
LEFT JOIN wensoul_user_subscriptions us ON u.id = us.user_id AND us.status = 1 
    AND us.end_time > NOW()
ORDER BY us.end_time DESC
LIMIT 1;

-- 用户存储使用情况视图
CREATE OR REPLACE VIEW `v_user_storage_summary` AS
SELECT 
    u.id as user_id,
    u.username,
    COALESCE(us.total_quota, 0) as total_quota,
    COALESCE(us.used_space, 0) as used_space,
    COALESCE(us.available_space, us.total_quota) as available_space,
    COALESCE(us.file_count, 0) as file_count,
    ROUND(COALESCE(us.used_space, 0) / COALESCE(NULLIF(us.total_quota, 0), 1) * 100, 2) as usage_percentage
FROM wensoul_user u
LEFT JOIN wensoul_user_storage us ON u.id = us.user_id
WHERE u.status = 1;

-- 用户资产统计视图
CREATE OR REPLACE VIEW `v_user_asset_stats` AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(a.id) as total_assets,
    COUNT(CASE WHEN a.asset_status = 1 THEN 1 END) as active_assets,
    COUNT(CASE WHEN a.asset_status = 3 THEN 1 END) as completed_assets,
    SUM(COALESCE(a.storage_used, 0)) as total_asset_storage,
    COUNT(CASE WHEN a.is_favorite = 1 THEN 1 END) as favorite_assets,
    (SELECT COUNT(*) FROM wensoul_asset_generations g WHERE g.user_id = u.id) as total_generations,
    (SELECT MAX(g.create_time) FROM wensoul_asset_generations g WHERE g.user_id = u.id) as last_generation_time
FROM wensoul_user u
LEFT JOIN wensoul_user_assets a ON u.id = a.user_id AND a.asset_status != 0
GROUP BY u.id, u.username;

-- ============================================================================
-- 数据库初始化完成提示
-- ============================================================================
SELECT '数据库初始化完成！' as status, NOW() as completed_at; 