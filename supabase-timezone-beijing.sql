-- ===============================================
-- 设置 Supabase 数据库时区为北京时间 (UTC+8)
-- ===============================================

-- 1. 设置数据库时区为北京时间
SET timezone = 'Asia/Shanghai';

-- 2. 验证当前时区设置
SELECT current_setting('timezone') as current_timezone;

-- 3. 显示当前北京时间
SELECT NOW() AT TIME ZONE 'Asia/Shanghai' as beijing_time;

-- 4. 更新所有表的默认时间戳函数，使其使用北京时间
-- 注意：PostgreSQL 的 NOW() 函数会返回当前时区的时间

-- 5. 如果需要强制使用北京时间的函数，可以创建一个自定义函数
CREATE OR REPLACE FUNCTION beijing_now() 
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'Asia/Shanghai';
END;
$$ LANGUAGE plpgsql;

-- 6. 测试函数
SELECT beijing_now() as beijing_now_function;

-- 7. 查看所有时间戳字段的当前值（示例查询）
SELECT 
    'sora2_invite_codes' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM sora2_invite_codes
UNION ALL
SELECT 
    'game_scores' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM game_scores
UNION ALL
SELECT 
    'sora2_user_stats' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM sora2_user_stats;

-- 8. 如果需要将现有数据转换为北京时间（如果需要的话）
-- 注意：只有在数据确实是其他时区时才需要转换
-- 由于我们使用的是 TIMESTAMP WITH TIME ZONE，数据会自动转换

-- 9. 创建索引以优化时区查询
CREATE INDEX IF NOT EXISTS idx_sora2_invite_codes_created_at_beijing 
ON sora2_invite_codes((created_at AT TIME ZONE 'Asia/Shanghai'));

CREATE INDEX IF NOT EXISTS idx_game_scores_created_at_beijing 
ON game_scores((created_at AT TIME ZONE 'Asia/Shanghai'));

-- 10. 验证时区设置成功
SELECT 
    'Database timezone setting' as info,
    current_setting('timezone') as timezone,
    NOW() as current_time,
    NOW() AT TIME ZONE 'Asia/Shanghai' as beijing_time;
