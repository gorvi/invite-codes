-- ===============================================
-- Sora 2 邀请码业务 - 优化后的表结构
-- ===============================================

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS sora2_hourly_stats CASCADE;
DROP TABLE IF EXISTS sora2_daily_stats CASCADE;
DROP TABLE IF EXISTS sora2_user_stats CASCADE;
DROP TABLE IF EXISTS sora2_analytics CASCADE;
DROP TABLE IF EXISTS sora2_invite_codes CASCADE;

-- ===============================================
-- 创建优化后的表结构
-- ===============================================

-- 1. 邀请码表（保持不变，设计合理）
CREATE TABLE sora2_invite_codes (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'invalid')),
  is_active BOOLEAN GENERATED ALWAYS AS (status = 'active') STORED,
  submitter_name VARCHAR(255) DEFAULT NULL,
  copy_count INTEGER DEFAULT 0,
  worked_votes INTEGER DEFAULT 0,
  didnt_work_votes INTEGER DEFAULT 0,
  unique_copied_count INTEGER DEFAULT 0,
  unique_worked_count INTEGER DEFAULT 0,
  unique_didnt_work_count INTEGER DEFAULT 0,
  worked_user_ids JSONB DEFAULT '[]'::jsonb,
  didnt_work_user_ids JSONB DEFAULT '[]'::jsonb,
  copied_user_ids JSONB DEFAULT '[]'::jsonb
);

-- 2. 全局统计表（简化，只存储真正的全局聚合数据）
CREATE TABLE sora2_analytics (
  id INTEGER PRIMARY KEY DEFAULT 1, -- 单行全局统计
  total_submit_count INTEGER DEFAULT 0,
  total_copy_clicks INTEGER DEFAULT 0,
  total_worked_votes INTEGER DEFAULT 0,
  total_didnt_work_votes INTEGER DEFAULT 0,
  total_unique_users INTEGER DEFAULT 0, -- 总独立用户数
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 用户统计表（新增，替代 userStats JSONB）
CREATE TABLE sora2_user_stats (
  user_id VARCHAR(255) PRIMARY KEY,
  copy_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0, -- 总投票数（worked + didntWork）
  submit_count INTEGER DEFAULT 0,
  first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 每日统计表（新增，替代 daily_stats JSONB）
CREATE TABLE sora2_daily_stats (
  date DATE PRIMARY KEY, -- 日期作为主键
  submit_count INTEGER DEFAULT 0,
  copy_clicks INTEGER DEFAULT 0,
  worked_votes INTEGER DEFAULT 0,
  didnt_work_votes INTEGER DEFAULT 0,
  unique_users_visited INTEGER DEFAULT 0, -- 当日独立访客数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 每小时统计表（可选，用于更细粒度的分析）
CREATE TABLE sora2_hourly_stats (
  date_hour TIMESTAMP WITH TIME ZONE PRIMARY KEY, -- 日期+小时作为主键
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  submit_count INTEGER DEFAULT 0,
  copy_clicks INTEGER DEFAULT 0,
  worked_votes INTEGER DEFAULT 0,
  didnt_work_votes INTEGER DEFAULT 0,
  unique_users_visited INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 索引优化
-- ===============================================

-- 删除现有索引（如果存在）
DROP INDEX IF EXISTS idx_sora2_hourly_stats_hour;
DROP INDEX IF EXISTS idx_sora2_hourly_stats_date;
DROP INDEX IF EXISTS idx_sora2_daily_stats_date;
DROP INDEX IF EXISTS idx_sora2_user_stats_created_at;
DROP INDEX IF EXISTS idx_sora2_user_stats_last_visit;
DROP INDEX IF EXISTS idx_sora2_invite_codes_created_at;
DROP INDEX IF EXISTS idx_sora2_invite_codes_active;
DROP INDEX IF EXISTS idx_sora2_invite_codes_status;

-- 创建索引
-- 邀请码表索引
CREATE INDEX idx_sora2_invite_codes_status ON sora2_invite_codes(status);
CREATE INDEX idx_sora2_invite_codes_active ON sora2_invite_codes(is_active);
CREATE INDEX idx_sora2_invite_codes_created_at ON sora2_invite_codes(created_at);

-- 用户统计表索引
CREATE INDEX idx_sora2_user_stats_last_visit ON sora2_user_stats(last_visit);
CREATE INDEX idx_sora2_user_stats_created_at ON sora2_user_stats(created_at);

-- 每日统计表索引
CREATE INDEX idx_sora2_daily_stats_date ON sora2_daily_stats(date);

-- 每小时统计表索引
CREATE INDEX idx_sora2_hourly_stats_date ON sora2_hourly_stats(date);
CREATE INDEX idx_sora2_hourly_stats_hour ON sora2_hourly_stats(hour);

-- ===============================================
-- 行级安全策略 (RLS)
-- ===============================================

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow anonymous upsert access" ON sora2_hourly_stats;
DROP POLICY IF EXISTS "Allow anonymous read access" ON sora2_hourly_stats;
DROP POLICY IF EXISTS "Allow anonymous upsert access" ON sora2_daily_stats;
DROP POLICY IF EXISTS "Allow anonymous read access" ON sora2_daily_stats;
DROP POLICY IF EXISTS "Allow anonymous upsert access" ON sora2_user_stats;
DROP POLICY IF EXISTS "Allow anonymous read access" ON sora2_user_stats;
DROP POLICY IF EXISTS "Allow anonymous update access" ON sora2_analytics;
DROP POLICY IF EXISTS "Allow anonymous read access" ON sora2_analytics;
DROP POLICY IF EXISTS "Allow anonymous update access" ON sora2_invite_codes;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON sora2_invite_codes;
DROP POLICY IF EXISTS "Allow anonymous read access" ON sora2_invite_codes;

-- 创建 RLS 策略
-- 邀请码表 RLS
ALTER TABLE sora2_invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_invite_codes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON sora2_invite_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON sora2_invite_codes FOR UPDATE USING (true);

-- 全局统计表 RLS
ALTER TABLE sora2_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_analytics FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update access" ON sora2_analytics FOR UPDATE USING (true);

-- 用户统计表 RLS
ALTER TABLE sora2_user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_user_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous upsert access" ON sora2_user_stats FOR ALL USING (true);

-- 每日统计表 RLS
ALTER TABLE sora2_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_daily_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous upsert access" ON sora2_daily_stats FOR ALL USING (true);

-- 每小时统计表 RLS
ALTER TABLE sora2_hourly_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_hourly_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous upsert access" ON sora2_hourly_stats FOR ALL USING (true);

-- ===============================================
-- 数据迁移脚本（从旧结构迁移到新结构）
-- ===============================================

-- 迁移 userStats JSONB 到 sora2_user_stats 表
-- INSERT INTO sora2_user_stats (user_id, copy_count, vote_count, submit_count, first_visit, last_visit)
-- SELECT 
--   key as user_id,
--   (value->>'copyCount')::INTEGER as copy_count,
--   (value->>'voteCount')::INTEGER as vote_count,
--   (value->>'submitCount')::INTEGER as submit_count,
--   (value->>'firstVisit')::TIMESTAMP WITH TIME ZONE as first_visit,
--   (value->>'lastVisit')::TIMESTAMP WITH TIME ZONE as last_visit
-- FROM sora2_analytics,
--      jsonb_each(user_stats) as t(key, value)
-- WHERE user_stats IS NOT NULL AND user_stats != '{}'::jsonb;

-- 迁移 daily_stats JSONB 到 sora2_daily_stats 表
-- INSERT INTO sora2_daily_stats (date, submit_count, copy_clicks, worked_votes, didnt_work_votes)
-- SELECT 
--   key::DATE as date,
--   (value->>'submitCount')::INTEGER as submit_count,
--   (value->>'copyClicks')::INTEGER as copy_clicks,
--   (value->>'workedVotes')::INTEGER as worked_votes,
--   (value->>'didntWorkVotes')::INTEGER as didnt_work_votes
-- FROM sora2_analytics,
--      jsonb_each(daily_stats) as t(key, value)
-- WHERE daily_stats IS NOT NULL AND daily_stats != '{}'::jsonb;

-- ===============================================
-- 示例查询
-- ===============================================

-- 获取全局统计数据
-- SELECT * FROM sora2_analytics WHERE id = 1;

-- 获取今日统计数据
-- SELECT * FROM sora2_daily_stats WHERE date = CURRENT_DATE;

-- 获取用户统计（前10名活跃用户）
-- SELECT * FROM sora2_user_stats 
-- ORDER BY copy_count + vote_count + submit_count DESC 
-- LIMIT 10;

-- 获取邀请码统计（活跃状态）
-- SELECT COUNT(*) as active_count FROM sora2_invite_codes WHERE status = 'active';

-- 获取最近7天的每日统计趋势
-- SELECT date, submit_count, copy_clicks, worked_votes, didnt_work_votes
-- FROM sora2_daily_stats 
-- WHERE date >= CURRENT_DATE - INTERVAL '7 days'
-- ORDER BY date DESC;
