# 部署方案对比与推荐

## 🎯 快速决策

### 如果你想要...

| 需求 | 推荐方案 | 理由 |
|------|---------|------|
| **快速上线，不想配置数据库** | Railway.app | 支持文件持久化，免费 $5/月 |
| **最佳 Next.js 体验** | Vercel + Vercel Postgres | 官方方案，完美集成 |
| **完全免费** | Render.com (有限制) | 但数据不持久化 |
| **最大灵活性** | VPS (Linode/DigitalOcean) | 完全控制，需要运维 |

---

## 📊 详细对比

### 1. Vercel（推荐 ⭐⭐⭐⭐⭐）

#### ✅ 优势
- 🚀 **最佳 Next.js 支持**（官方平台）
- ⚡ **全球 CDN 加速**
- 🔄 **自动 CI/CD**（推送即部署）
- 📊 **内置分析**（性能监控）
- 🆓 **慷慨的免费额度**

#### ❌ 限制
- 文件系统**临时**（每次部署重置）
- 需要配合数据库使用

#### 💰 费用
- **免费版**：
  - 100 GB 带宽/月
  - 100 次部署/天
  - 无限网站
  
- **Pro 版**（$20/月）：
  - 1 TB 带宽/月
  - 密码保护

#### 🔧 数据库选项

| 数据库 | 免费额度 | 适合场景 |
|--------|---------|---------|
| **Vercel Postgres** | 60小时/月，256MB | 小型项目 ⭐⭐⭐⭐⭐ |
| **Supabase** | 500MB，无限请求 | 中型项目 ⭐⭐⭐⭐⭐ |
| **MongoDB Atlas** | 512MB | NoSQL 需求 ⭐⭐⭐⭐ |
| **PlanetScale** | 5GB | MySQL 需求 ⭐⭐⭐⭐ |

#### 📝 部署步骤
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 添加 Postgres 数据库
# 在 Vercel Dashboard → Storage → Create Database → Postgres

# 5. 初始化数据库
# 在 Vercel SQL 编辑器中运行 DATABASE_MIGRATION.md 中的 SQL
```

---

### 2. Railway.app（推荐 ⭐⭐⭐⭐⭐）

#### ✅ 优势
- 💾 **支持文件持久化**（Persistent Volume）
- 🐳 **Docker 支持**
- 📦 **内置 PostgreSQL**
- 🔄 **GitHub 自动部署**
- 💰 **$5/月免费额度**

#### ❌ 限制
- 免费额度用完后需付费
- 冷启动可能较慢

#### 💰 费用
- **免费版**：$5 credit/月（约 500 小时运行时间）
- **超出后**：$0.000231/GB-second

#### 🔧 配置持久化存储

**方法 1：使用内置 PostgreSQL**
```bash
# 1. 在 Railway 创建项目
# 2. 添加 PostgreSQL 服务
# 3. 应用会自动获得 DATABASE_URL 环境变量
```

**方法 2：使用文件持久化**
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/"
restartPolicyType = "on-failure"

[[volumes]]
mountPath = "/app/data"
name = "invite-codes-data"
```

#### 📝 部署步骤
```bash
# 1. 安装 Railway CLI
npm i -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 添加持久化卷（在 Dashboard）
# Settings → Volumes → New Volume
# Mount Path: /app/data

# 5. 部署
railway up
```

---

### 3. Render.com（⭐⭐⭐⭐）

#### ✅ 优势
- 🆓 **完全免费**（有限制）
- 🐳 **Docker 支持**
- 📦 **内置 PostgreSQL**
- 🔄 **自动部署**

#### ❌ 限制
- ⚠️ **免费版无持久化存储**
- 🐌 **冷启动慢**（15分钟无请求后休眠）
- ⏱️ **构建时间限制**（15分钟）

#### 💰 费用
- **免费版**：
  - 750 小时/月
  - 100 GB 带宽
  - **无持久化存储**
  
- **Starter 版**（$7/月）：
  - 持久化磁盘

#### 📝 部署步骤
```bash
# 1. 创建 render.yaml
cat > render.yaml << EOF
services:
  - type: web
    name: sora-invite-code
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: sora-db
          property: connectionString

databases:
  - name: sora-db
    databaseName: sora
    user: sora
    plan: free
EOF

# 2. 推送到 GitHub
git add render.yaml
git commit -m "Add Render config"
git push

# 3. 在 Render Dashboard 连接 GitHub 仓库
```

---

### 4. Fly.io（⭐⭐⭐⭐）

#### ✅ 优势
- 💾 **支持持久化存储**
- 🌍 **多区域部署**
- 🐳 **原生 Docker**
- 📊 **实时日志**

#### ❌ 限制
- 配置较复杂
- 需要信用卡验证

#### 💰 费用
- **免费版**：
  - 3 台 shared-cpu-1x 实例
  - 3 GB 持久化存储
  - 160 GB 流量

#### 📝 部署步骤
```bash
# 1. 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. 登录
fly auth login

# 3. 初始化应用
fly launch

# 4. 添加持久化卷
fly volumes create invite_data --size 1

# 5. 部署
fly deploy
```

---

### 5. GitHub Pages（❌ 不推荐）

#### ❌ 为什么不行？
- **只能托管静态文件**（HTML/CSS/JS）
- ❌ 无法运行 Node.js 服务器
- ❌ 无法使用 API Routes
- ❌ 无法使用 SSE
- ❌ 无法使用文件系统

#### 解决方案
将 GitHub Pages 用于**前端展示**，后端部署到其他平台：
```
GitHub Pages: 静态前端（React/Vue/Next.js export）
     ↓ API 请求
Vercel/Railway: 后端 API + 数据库
```

---

## 🏆 最终推荐

### 场景 1：个人项目，想快速上线
```
Railway.app + 文件持久化
或
Vercel + Supabase
```

**理由**：
- ✅ 配置简单
- ✅ 免费额度够用
- ✅ 数据持久化
- ✅ 自动部署

---

### 场景 2：正式生产项目
```
Vercel + Vercel Postgres
或
Railway + PostgreSQL
```

**理由**：
- ✅ 数据库性能更好
- ✅ 可扩展性强
- ✅ 专业监控
- ✅ 自动备份

---

### 场景 3：完全免费
```
Render.com Free + PostgreSQL Free
```

**限制**：
- ⚠️ 冷启动慢（15分钟无请求后休眠）
- ⚠️ 数据库连接数限制
- ⚠️ 构建时间限制

---

## 📝 迁移步骤（文件存储 → 数据库）

### 第一步：选择数据库方案
推荐：**Vercel Postgres** 或 **Supabase**

### 第二步：创建数据库
```sql
-- 运行 DATABASE_MIGRATION.md 中的 SQL 脚本
CREATE TABLE invite_codes (...);
CREATE TABLE unique_voters (...);
-- ...
```

### 第三步：迁移现有数据
```bash
# 导出现有数据
curl http://localhost:3000/api/analytics > backup.json

# 运行迁移脚本
node scripts/migrate-data.js
```

### 第四步：更新代码
```typescript
// 替换 lib/data.ts 中的文件操作
import { sql } from '@vercel/postgres'

export async function getInviteCodes() {
  const { rows } = await sql`SELECT * FROM invite_codes WHERE status = 'active'`
  return rows
}
```

### 第五步：部署
```bash
vercel --prod
```

---

## 🔒 安全建议

### 1. 环境变量
```bash
# .env.local
DATABASE_URL="postgres://..."
ADMIN_KEY="your-secure-random-key-here"
AUTO_CLEANUP=true
```

### 2. API 密钥
```bash
# 生成安全密钥
openssl rand -hex 32
```

### 3. 数据库备份
```bash
# 定时备份脚本
#!/bin/bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
aws s3 cp backup-*.sql s3://your-bucket/backups/
```

### 4. CORS 配置
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' }
        ]
      }
    ]
  }
}
```

---

## 📊 性能优化

### 1. 数据库索引
```sql
CREATE INDEX idx_invite_codes_status ON invite_codes(status);
CREATE INDEX idx_invite_codes_created_at ON invite_codes(created_at DESC);
```

### 2. 缓存策略
```typescript
// 使用 Redis 缓存活跃邀请码
import { createClient } from '@vercel/kv'

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

export async function getActiveCodesCached() {
  const cached = await kv.get('active_codes')
  if (cached) return cached
  
  const codes = await getActiveCodesFromDB()
  await kv.set('active_codes', codes, { ex: 60 }) // 缓存 60 秒
  return codes
}
```

### 3. CDN 加速
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
  },
  // 启用图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}
```

---

## 🆘 常见问题

### Q: 数据会丢失吗？
A: 
- **文件存储** → Vercel/Netlify 会丢失 ❌
- **文件存储** → Railway/Render/Fly 不会丢失 ✅
- **数据库** → 永远不会丢失 ✅

### Q: 免费额度够用吗？
A: 
- **Vercel**: 100 GB/月 → 约 10,000 用户访问 ✅
- **Railway**: $5/月 → 约 500 小时运行时间 ✅
- **Supabase**: 500 MB → 约 50,000 邀请码 ✅

### Q: 如何监控使用量？
A: 
```bash
# Vercel
vercel whoami

# Railway
railway status

# 数据库
SELECT pg_size_pretty(pg_database_size('verceldb'));
```

### Q: 如何回滚部署？
A: 
```bash
# Vercel
vercel rollback <deployment-url>

# Railway
railway rollback

# 手动回滚
git revert HEAD
git push
```

