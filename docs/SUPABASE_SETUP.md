# Supabase 数据库设置指南

## 🎯 概述

本项目已配置支持 Supabase 作为主要数据库，提供免费的 PostgreSQL 数据库服务。

## 📋 环境变量配置

### 本地开发环境
在项目根目录创建 `.env.local` 文件：

```bash
# Supabase Configuration
SUPABASE_URL=https://falabplsmyvffyylpnwn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGFicGxzbXl2ZmZ5eWxwbnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mzk5MTAsImV4cCI6MjA3NTExNTkxMH0.YL6i92IQkMCJej4u0ga85pdGBSDAiqh9MhQBcUautAE

# Vercel KV (备用)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

### Vercel 生产环境
在 Vercel 项目设置中添加以下环境变量：

1. 进入 Vercel 仪表盘
2. 选择项目 → Settings → Environment Variables
3. 添加以下变量：

```
SUPABASE_URL = https://falabplsmyvffyylpnwn.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGFicGxzbXl2ZmZ5eWxwbnduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mzk5MTAsImV4cCI6MjA3NTExNTkxMH0.YL6i92IQkMCJej4u0ga85pdGBSDAiqh9MhQBcUautAE
```

## 🗄️ 数据库表结构

### 1. 邀请码表 (invite_codes)
```sql
CREATE TABLE invite_codes (
  id SERIAL PRIMARY KEY,
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
```

### 2. 统计表 (analytics)
```sql
CREATE TABLE analytics (
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
```

## 🚀 设置步骤

### 1. 创建 Supabase 项目
- 访问 [Supabase](https://supabase.com)
- 创建新项目：`sora2-invite-codes`
- 等待项目创建完成

### 2. 执行 SQL 脚本
1. 进入 Supabase 仪表盘
2. 点击左侧 "SQL Editor"
3. 复制 `supabase-schema.sql` 内容
4. 粘贴并执行

### 3. 配置环境变量
按照上述环境变量配置设置

### 4. 测试连接
启动开发服务器：
```bash
npm run dev
```

查看控制台日志，应该显示：
```
[Supabase] Initialized successfully
[Persistence] Using supabase storage for development environment
```

## 🔄 存储优先级

系统按以下优先级选择存储方式：

1. **Supabase** (如果配置了 SUPABASE_URL 和 SUPABASE_ANON_KEY)
2. **Vercel KV** (如果配置了 KV_REST_API_URL 和 KV_REST_API_TOKEN)
3. **本地文件** (开发环境默认)

## 💡 优势

### Supabase vs Upstash Redis
- ✅ **免费额度更大**: 500MB 存储 vs 256MB
- ✅ **关系型数据库**: 支持复杂查询和关联
- ✅ **实时功能**: 内置实时数据同步
- ✅ **自动 API**: 自动生成 REST API
- ✅ **更好的扩展性**: 支持更多数据类型

## 🔒 安全设置

- ✅ **行级安全策略 (RLS)** 已启用
- ✅ **匿名访问权限** 已配置
- ✅ **数据验证** 在应用层进行

## 📊 监控和调试

### 查看数据库使用情况
1. 进入 Supabase 仪表盘
2. 查看 "Database" 部分的使用统计

### 调试连接问题
检查控制台日志：
```
[Supabase] Initialized successfully
[Supabase] Successfully saved X invite codes
[Supabase] Successfully loaded X invite codes
```

## 🆘 故障排除

### 常见问题

1. **连接失败**
   - 检查环境变量是否正确设置
   - 确认 Supabase 项目状态正常

2. **权限错误**
   - 确认 RLS 策略已正确配置
   - 检查 anon key 是否有效

3. **数据不同步**
   - 检查网络连接
   - 查看 Supabase 日志

## 📈 性能优化

- ✅ **数据库索引** 已创建
- ✅ **连接池** 自动管理
- ✅ **查询优化** 使用适当的 WHERE 条件

---

**注意**: 这个配置将完全替代 Upstash Redis，提供更稳定和免费的数据库服务。
