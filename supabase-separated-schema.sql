-- ===============================================
-- Sora 2 邀请码业务 - 独立表结构
-- ===============================================

-- 邀请码表
CREATE TABLE IF NOT EXISTS sora2_invite_codes (
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

-- Sora 2 业务统计表
CREATE TABLE IF NOT EXISTS sora2_analytics (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_submit_count INTEGER DEFAULT 0,
  total_copy_clicks INTEGER DEFAULT 0,
  total_worked_votes INTEGER DEFAULT 0,
  total_didnt_work_votes INTEGER DEFAULT 0,
  daily_stats JSONB DEFAULT '{}'::jsonb,
  user_stats JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 打地鼠游戏业务 - 独立表结构
-- ===============================================

-- 游戏分数表（独立存储每个游戏记录）
CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  hamsters_whacked INTEGER DEFAULT 0,
  game_duration INTEGER DEFAULT 0, -- 游戏时长（秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 游戏全局统计表
CREATE TABLE IF NOT EXISTS game_analytics (
  id INTEGER PRIMARY KEY DEFAULT 1,
  global_best_score INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_hamsters_whacked INTEGER DEFAULT 0,
  total_players INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户游戏统计表
CREATE TABLE IF NOT EXISTS game_user_stats (
  user_id VARCHAR(255) PRIMARY KEY,
  personal_best_score INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_hamsters_whacked INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0, -- 总游戏时长（秒）
  first_play_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_play_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 索引优化
-- ===============================================

-- Sora 2 业务索引
CREATE INDEX IF NOT EXISTS idx_sora2_invite_codes_active ON sora2_invite_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_sora2_invite_codes_status ON sora2_invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_sora2_invite_codes_created_at ON sora2_invite_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_sora2_invite_codes_code ON sora2_invite_codes(code);

-- 游戏业务索引
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at);
CREATE INDEX IF NOT EXISTS idx_game_user_stats_score ON game_user_stats(personal_best_score DESC);

-- ===============================================
-- 行级安全策略 (RLS)
-- ===============================================

-- Sora 2 业务 RLS
ALTER TABLE sora2_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sora2_analytics ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取活跃的邀请码
CREATE POLICY "Allow anonymous read active codes"
ON sora2_invite_codes FOR SELECT USING (is_active = true);

-- 允许匿名用户插入新邀请码
CREATE POLICY "Allow anonymous insert codes"
ON sora2_invite_codes FOR INSERT WITH CHECK (true);

-- 允许匿名用户更新投票数据
CREATE POLICY "Allow anonymous update votes"
ON sora2_invite_codes FOR UPDATE USING (true);

-- 允许匿名用户读取统计数据
CREATE POLICY "Allow anonymous read analytics"
ON sora2_analytics FOR SELECT USING (true);

-- 允许匿名用户更新统计数据
CREATE POLICY "Allow anonymous update analytics"
ON sora2_analytics FOR UPDATE USING (true);

-- 允许匿名用户插入统计数据
CREATE POLICY "Allow anonymous insert analytics"
ON sora2_analytics FOR INSERT WITH CHECK (true);

-- 游戏业务 RLS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_user_stats ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户插入游戏分数
CREATE POLICY "Allow anonymous insert scores"
ON game_scores FOR INSERT WITH CHECK (true);

-- 允许匿名用户读取游戏分数（用于排行榜）
CREATE POLICY "Allow anonymous read scores"
ON game_scores FOR SELECT USING (true);

-- 允许匿名用户读取游戏统计
CREATE POLICY "Allow anonymous read game analytics"
ON game_analytics FOR SELECT USING (true);

-- 允许匿名用户更新游戏统计
CREATE POLICY "Allow anonymous update game analytics"
ON game_analytics FOR UPDATE USING (true);

-- 允许匿名用户插入游戏统计
CREATE POLICY "Allow anonymous insert game analytics"
ON game_analytics FOR INSERT WITH CHECK (true);

-- 允许匿名用户插入和更新用户游戏统计
CREATE POLICY "Allow anonymous manage user stats"
ON game_user_stats FOR ALL USING (true);

-- ===============================================
-- 视图（用于公开访问）
-- ===============================================

-- 活跃邀请码视图
CREATE OR REPLACE VIEW active_invite_codes AS
SELECT id, code, created_at, copy_count, worked_votes, didnt_work_votes,
       unique_copied_count, unique_worked_count, unique_didnt_work_count
FROM sora2_invite_codes
WHERE is_active = true
ORDER BY created_at DESC;

-- 游戏排行榜视图（前100名）
CREATE OR REPLACE VIEW game_leaderboard AS
SELECT 
  gs.user_id,
  gs.score,
  gs.level,
  gs.hamsters_whacked,
  gs.created_at,
  ROW_NUMBER() OVER (ORDER BY gs.score DESC, gs.created_at ASC) as rank
FROM game_scores gs
ORDER BY gs.score DESC, gs.created_at ASC
LIMIT 100;

-- 日统计摘要视图
CREATE OR REPLACE VIEW daily_stats_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_games,
  MAX(score) as daily_best_score,
  AVG(score)::INTEGER as avg_score,
  SUM(hamsters_whacked) as total_hamsters
FROM game_scores
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
