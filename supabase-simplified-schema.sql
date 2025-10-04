-- ===============================================
-- Sora 2 邀请码 + 打地鼠游戏 - 简化数据库表结构
-- 去掉预聚合表，使用实时查询
-- ===============================================

-- 删除现有表（如果存在）- 按依赖关系倒序删除
DROP TABLE IF EXISTS sora2_hourly_stats CASCADE;
DROP TABLE IF EXISTS sora2_daily_stats CASCADE;
DROP TABLE IF EXISTS sora2_user_stats CASCADE;
DROP TABLE IF EXISTS sora2_submitter_stats CASCADE;
DROP TABLE IF EXISTS sora2_analytics CASCADE;
DROP TABLE IF EXISTS sora2_invite_codes CASCADE;
DROP TABLE IF EXISTS game_user_stats CASCADE;
-- DROP TABLE IF EXISTS game_analytics CASCADE; -- 不再需要
DROP TABLE IF EXISTS game_scores CASCADE;

-- ===============================================
-- Sora 2 邀请码业务表
-- ===============================================

-- 1. 邀请码表（核心业务实体）
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

-- 2. 用户统计表（替代 userStats JSONB）
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

-- 3. 提交人统计表（新增）
CREATE TABLE sora2_submitter_stats (
  submitter_name VARCHAR(255) PRIMARY KEY,
  total_codes_submitted INTEGER DEFAULT 0,
  active_codes_count INTEGER DEFAULT 0,
  used_codes_count INTEGER DEFAULT 0,
  invalid_codes_count INTEGER DEFAULT 0,
  total_copies_received INTEGER DEFAULT 0, -- 所有提交的邀请码被复制的总次数
  total_votes_received INTEGER DEFAULT 0, -- 所有提交的邀请码收到的投票总数
  success_rate DECIMAL(5,2) DEFAULT 0.00, -- 成功率 (worked votes / total votes)
  first_submission TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_submission TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 每日统计表（替代 daily_stats JSONB）
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
-- 打地鼠游戏业务表
-- ===============================================

-- 6. 游戏分数表（独立存储每个游戏记录）
CREATE TABLE game_scores (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  hamsters_whacked INTEGER DEFAULT 0,
  game_duration INTEGER DEFAULT 0, -- 游戏时长（秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 游戏全局统计表（删除，改为实时查询）
-- CREATE TABLE game_analytics (...); -- 不再需要

-- 7. 用户游戏统计表
CREATE TABLE game_user_stats (
  user_id VARCHAR(255) PRIMARY KEY,
  personal_best_score INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_hamsters_whacked INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0, -- 总游戏时长（秒）
  first_play_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_play_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 实时统计视图（替代所有预聚合表）
-- ===============================================

-- Sora 2 实时统计视图
CREATE OR REPLACE VIEW sora2_stats AS
SELECT 
  (SELECT COUNT(*) FROM sora2_invite_codes WHERE status = 'active') as active_count,
  (SELECT COUNT(*) FROM sora2_invite_codes) as total_count,
  (SELECT COUNT(*) FROM sora2_invite_codes WHERE status = 'used') as used_count,
  (SELECT COUNT(*) FROM sora2_invite_codes WHERE status = 'invalid') as invalid_count,
  (SELECT COUNT(*) FROM sora2_user_stats) as total_users,
  (SELECT COUNT(*) FROM sora2_submitter_stats) as total_submitters,
  (SELECT COALESCE(SUM(copy_count), 0) FROM sora2_user_stats) as total_copies,
  (SELECT COALESCE(SUM(vote_count), 0) FROM sora2_user_stats) as total_votes,
  (SELECT COALESCE(SUM(submit_count), 0) FROM sora2_user_stats) as total_submits,
  (SELECT COALESCE(SUM(submit_count), 0) FROM sora2_daily_stats WHERE date = CURRENT_DATE) as today_submits,
  (SELECT COALESCE(SUM(copy_clicks), 0) FROM sora2_daily_stats WHERE date = CURRENT_DATE) as today_copies,
  (SELECT COALESCE(SUM(worked_votes), 0) FROM sora2_daily_stats WHERE date = CURRENT_DATE) as today_worked_votes,
  (SELECT COALESCE(SUM(didnt_work_votes), 0) FROM sora2_daily_stats WHERE date = CURRENT_DATE) as today_didnt_work_votes;

-- 游戏实时统计视图
CREATE OR REPLACE VIEW game_stats AS
SELECT 
  (SELECT COALESCE(MAX(personal_best_score), 0) FROM game_user_stats) as global_best_score,
  (SELECT COUNT(*) FROM game_scores) as total_games_played,
  (SELECT COALESCE(SUM(hamsters_whacked), 0) FROM game_scores) as total_hamsters_whacked,
  (SELECT COUNT(*) FROM game_user_stats) as total_players,
  (SELECT COALESCE(AVG(score), 0) FROM game_scores) as average_score,
  (SELECT COUNT(*) FROM game_scores WHERE created_at >= CURRENT_DATE) as today_games_played;

-- ===============================================
-- 索引优化
-- ===============================================

-- 删除现有索引（如果存在）
DROP INDEX IF EXISTS idx_sora2_hourly_stats_hour;
DROP INDEX IF EXISTS idx_sora2_hourly_stats_date;
DROP INDEX IF EXISTS idx_sora2_daily_stats_date;
DROP INDEX IF EXISTS idx_sora2_user_stats_updated_at;
DROP INDEX IF EXISTS idx_sora2_user_stats_created_at;
DROP INDEX IF EXISTS idx_sora2_user_stats_last_visit;
DROP INDEX IF EXISTS idx_sora2_invite_codes_created_at;
DROP INDEX IF EXISTS idx_sora2_invite_codes_active;
DROP INDEX IF EXISTS idx_sora2_invite_codes_status;
DROP INDEX IF EXISTS idx_sora2_invite_codes_code;
DROP INDEX IF EXISTS idx_game_user_stats_last_play_at;
DROP INDEX IF EXISTS idx_game_user_stats_personal_best_score;
DROP INDEX IF EXISTS idx_game_scores_created_at;
DROP INDEX IF EXISTS idx_game_scores_score;
DROP INDEX IF EXISTS idx_game_scores_user_id;

-- Sora 2 业务索引
CREATE INDEX idx_sora2_invite_codes_code ON sora2_invite_codes(code);
CREATE INDEX idx_sora2_invite_codes_status ON sora2_invite_codes(status);
CREATE INDEX idx_sora2_invite_codes_active ON sora2_invite_codes(is_active);
CREATE INDEX idx_sora2_invite_codes_created_at ON sora2_invite_codes(created_at);
CREATE INDEX idx_sora2_invite_codes_submitter ON sora2_invite_codes(submitter_name);

-- Sora 2 统计索引
CREATE INDEX idx_sora2_user_stats_last_visit ON sora2_user_stats(last_visit);
CREATE INDEX idx_sora2_user_stats_created_at ON sora2_user_stats(created_at);
CREATE INDEX idx_sora2_user_stats_updated_at ON sora2_user_stats(updated_at);

CREATE INDEX idx_sora2_submitter_stats_last_submission ON sora2_submitter_stats(last_submission);
CREATE INDEX idx_sora2_submitter_stats_total_codes ON sora2_submitter_stats(total_codes_submitted);
CREATE INDEX idx_sora2_submitter_stats_success_rate ON sora2_submitter_stats(success_rate);

CREATE INDEX idx_sora2_daily_stats_date ON sora2_daily_stats(date);

CREATE INDEX idx_sora2_hourly_stats_date ON sora2_hourly_stats(date);
CREATE INDEX idx_sora2_hourly_stats_hour ON sora2_hourly_stats(hour);

-- 游戏业务索引
CREATE INDEX idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX idx_game_scores_created_at ON game_scores(created_at);

-- 游戏用户统计索引
CREATE INDEX idx_game_user_stats_personal_best_score ON game_user_stats(personal_best_score DESC);
CREATE INDEX idx_game_user_stats_last_play_at ON game_user_stats(last_play_at);

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
DROP POLICY IF EXISTS "Allow anonymous upsert access" ON sora2_submitter_stats;
DROP POLICY IF EXISTS "Allow anonymous read access" ON sora2_submitter_stats;
DROP POLICY IF EXISTS "Allow anonymous update access" ON sora2_invite_codes;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON sora2_invite_codes;
DROP POLICY IF EXISTS "Allow anonymous read access" ON sora2_invite_codes;
DROP POLICY IF EXISTS "Allow anonymous upsert access" ON game_user_stats;
DROP POLICY IF EXISTS "Allow anonymous read access" ON game_user_stats;
-- DROP POLICY IF EXISTS "Allow anonymous update access" ON game_analytics; -- 不再需要
-- DROP POLICY IF EXISTS "Allow anonymous read access" ON game_analytics; -- 不再需要
DROP POLICY IF EXISTS "Allow anonymous insert access" ON game_scores;
DROP POLICY IF EXISTS "Allow anonymous read access" ON game_scores;

-- Sora 2 业务 RLS 策略
-- 邀请码表 RLS
ALTER TABLE sora2_invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_invite_codes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON sora2_invite_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON sora2_invite_codes FOR UPDATE USING (true);

-- 用户统计表 RLS
ALTER TABLE sora2_user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_user_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous upsert access" ON sora2_user_stats FOR ALL USING (true);

-- 提交人统计表 RLS
ALTER TABLE sora2_submitter_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_submitter_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous upsert access" ON sora2_submitter_stats FOR ALL USING (true);

-- 每日统计表 RLS
ALTER TABLE sora2_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_daily_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous upsert access" ON sora2_daily_stats FOR ALL USING (true);

-- 每小时统计表 RLS
ALTER TABLE sora2_hourly_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON sora2_hourly_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous upsert access" ON sora2_hourly_stats FOR ALL USING (true);

-- 游戏业务 RLS 策略
-- 游戏分数表 RLS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON game_scores FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON game_scores FOR INSERT WITH CHECK (true);

-- 游戏全局统计表 RLS (删除，改为实时查询)
-- ALTER TABLE game_analytics ENABLE ROW LEVEL SECURITY; -- 不再需要
-- CREATE POLICY "Allow anonymous read access" ON game_analytics FOR SELECT USING (true); -- 不再需要
-- CREATE POLICY "Allow anonymous update access" ON game_analytics FOR UPDATE USING (true); -- 不再需要

-- 用户游戏统计表 RLS
ALTER TABLE game_user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON game_user_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous upsert access" ON game_user_stats FOR ALL USING (true);

-- ===============================================
-- 初始化数据
-- ===============================================

-- 不再需要初始化预聚合表，因为使用实时查询

-- ===============================================
-- 示例查询
-- ===============================================

-- 获取 Sora 2 实时统计数据
-- SELECT * FROM sora2_stats;

-- 获取今日 Sora 2 统计数据
-- SELECT * FROM sora2_daily_stats WHERE date = CURRENT_DATE;

-- 获取用户统计（前10名活跃用户）
-- SELECT * FROM sora2_user_stats 
-- ORDER BY copy_count + vote_count + submit_count DESC 
-- LIMIT 10;

-- 获取邀请码统计（活跃状态）
-- SELECT COUNT(*) as active_count FROM sora2_invite_codes WHERE status = 'active';

-- 获取游戏实时统计数据
-- SELECT * FROM game_stats;

-- 获取游戏排行榜（前10名）
-- SELECT user_id, personal_best_score, total_games_played 
-- FROM game_user_stats 
-- ORDER BY personal_best_score DESC 
-- LIMIT 10;

-- 获取提交人排行榜（按提交数量排序）
-- SELECT submitter_name, total_codes_submitted, active_codes_count, success_rate 
-- FROM sora2_submitter_stats 
-- ORDER BY total_codes_submitted DESC 
-- LIMIT 10;

-- 获取提交人排行榜（按成功率排序）
-- SELECT submitter_name, total_codes_submitted, success_rate, total_copies_received 
-- FROM sora2_submitter_stats 
-- WHERE total_codes_submitted > 0 
-- ORDER BY success_rate DESC 
-- LIMIT 10;

-- 获取某个提交人的详细统计
-- SELECT 
--   submitter_name,
--   total_codes_submitted,
--   active_codes_count,
--   used_codes_count,
--   invalid_codes_count,
--   success_rate,
--   first_submission,
--   last_submission
-- FROM sora2_submitter_stats 
-- WHERE submitter_name = '用户名';

-- 获取最近7天的每日统计趋势
-- SELECT date, submit_count, copy_clicks, worked_votes, didnt_work_votes
-- FROM sora2_daily_stats 
-- WHERE date >= CURRENT_DATE - INTERVAL '7 days'
-- ORDER BY date DESC;

-- ===============================================
-- 表结构说明
-- ===============================================

/*
Sora 2 邀请码业务表 (简化版):
- sora2_invite_codes: 邀请码实体表，存储每个邀请码的详细信息
- sora2_user_stats: 用户统计表，存储每个用户的行为统计
- sora2_submitter_stats: 提交人统计表，存储每个提交人的统计信息
- sora2_daily_stats: 每日统计表，存储每天的汇总数据
- sora2_hourly_stats: 每小时统计表，存储每小时的汇总数据（可选）
- sora2_stats: 实时统计视图，替代原来的 sora2_analytics 表

打地鼠游戏业务表:
- game_scores: 游戏分数表，存储每次游戏的具体记录
- game_user_stats: 用户游戏统计表，存储每个用户的游戏统计
- game_stats: 游戏实时统计视图，替代原来的 game_analytics 表

设计原则:
1. 业务分离: Sora 2 和游戏业务完全独立
2. 数据规范化: 避免 JSONB 字段过大导致的性能问题
3. 实时查询: 使用视图提供实时统计数据，确保数据一致性
4. 索引优化: 为常用查询创建合适的索引
5. 安全策略: 启用 RLS 确保数据安全
6. 扩展性: 支持未来功能扩展

优势:
- 数据始终准确，无需维护聚合逻辑
- 架构简化，减少维护成本
- 适合中小规模数据
- 查询逻辑透明，易于调试
*/
