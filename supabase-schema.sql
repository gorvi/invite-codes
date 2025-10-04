-- Supabase 数据库表结构
-- 用于 Sora 2 邀请码项目

-- 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  submitter_name VARCHAR(255),
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

-- 统计表
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY DEFAULT 1,
  global_best_score INTEGER DEFAULT 0,
  total_submit_count INTEGER DEFAULT 0,
  total_copy_clicks INTEGER DEFAULT 0,
  total_worked_votes INTEGER DEFAULT 0,
  total_didnt_work_votes INTEGER DEFAULT 0,
  daily_stats JSONB DEFAULT '{}'::jsonb,
  user_stats JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at ON invite_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- 设置行级安全策略 (RLS)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取和写入数据
CREATE POLICY "Allow anonymous read access" ON invite_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access" ON invite_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" ON invite_codes
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access" ON invite_codes
  FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access analytics" ON analytics
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access analytics" ON analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access analytics" ON analytics
  FOR UPDATE USING (true);
