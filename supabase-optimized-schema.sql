-- Supabase 优化数据库表结构
-- 减少 JSON 字段使用，提高查询性能

-- 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
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

-- 全局统计表（简化版）
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY DEFAULT 1,
  global_best_score INTEGER DEFAULT 0,
  total_submit_count INTEGER DEFAULT 0,
  total_copy_clicks INTEGER DEFAULT 0,
  total_worked_votes INTEGER DEFAULT 0,
  total_didnt_work_votes INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_hamsters_whacked INTEGER DEFAULT 0,
  daily_stats JSONB DEFAULT '{}'::jsonb,
  user_stats JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 游戏分数表（独立存储）
CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  hamsters_whacked INTEGER DEFAULT 0,
  game_duration INTEGER DEFAULT 0, -- 游戏时长（秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户统计表（独立存储）
CREATE TABLE IF NOT EXISTS user_stats (
  user_id VARCHAR(255) PRIMARY KEY,
  copy_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  submit_count INTEGER DEFAULT 0,
  personal_best_score INTEGER DEFAULT 0,
  first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_visits INTEGER DEFAULT 1
);

-- 每日统计表（独立存储）
CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY,
  submit_count INTEGER DEFAULT 0,
  copy_clicks INTEGER DEFAULT 0,
  worked_votes INTEGER DEFAULT 0,
  didnt_work_votes INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  new_codes INTEGER DEFAULT 0,
  used_codes INTEGER DEFAULT 0
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at ON invite_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at);

CREATE INDEX IF NOT EXISTS idx_user_stats_last_visit ON user_stats(last_visit);
CREATE INDEX IF NOT EXISTS idx_user_stats_personal_best ON user_stats(personal_best_score DESC);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- 启用 Row Level Security (RLS)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 - 允许匿名访问
CREATE POLICY "Allow anonymous read access" ON invite_codes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON invite_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON invite_codes FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON invite_codes FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON analytics FOR SELECT USING (true);
CREATE POLICY "Allow anonymous update access" ON analytics FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous insert access" ON analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" ON game_scores FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON game_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON game_scores FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read access" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON user_stats FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read access" ON daily_stats FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON daily_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON daily_stats FOR UPDATE USING (true);

-- 创建视图：活跃邀请码
CREATE OR REPLACE VIEW active_invite_codes AS
SELECT * FROM invite_codes WHERE is_active = true;

-- 创建视图：游戏排行榜
CREATE OR REPLACE VIEW game_leaderboard AS
SELECT 
  user_id,
  MAX(score) as best_score,
  MAX(level) as best_level,
  COUNT(*) as games_played,
  MAX(created_at) as last_played
FROM game_scores 
GROUP BY user_id 
ORDER BY best_score DESC, last_played DESC;

-- 创建视图：每日统计摘要
CREATE OR REPLACE VIEW daily_stats_summary AS
SELECT 
  date,
  submit_count,
  copy_clicks,
  worked_votes,
  didnt_work_votes,
  unique_visitors,
  new_codes,
  used_codes,
  (worked_votes + didnt_work_votes) as total_votes
FROM daily_stats 
ORDER BY date DESC;
