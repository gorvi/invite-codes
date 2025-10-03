# 🚀 部署配置指南

## 📋 环境变量设置

### 在 Vercel Dashboard 中设置环境变量

#### 1. 进入项目设置
- 登录 [Vercel Dashboard](https://vercel.com/dashboard)
- 选择你的项目
- 点击 **Settings** → **Environment Variables**

#### 2. 添加环境变量

**生产环境 (Production)**
```
KV_REST_API_URL = https://your-prod-redis.upstash.io
KV_REST_API_TOKEN = your-prod-token
NODE_ENV = production
VERCEL_ENV = production
```

**预览环境 (Preview)**
```
KV_REST_API_URL = https://your-dev-redis.upstash.io
KV_REST_API_TOKEN = your-dev-token
NODE_ENV = production
VERCEL_ENV = preview
```

**开发环境 (Development)**
```
NODE_ENV = development
VERCEL_ENV = development
```

## 🏗️ 推荐的部署架构

### 方案 1: 双项目策略 (推荐)

```
项目 A: sora-invite-codes-dev
├── 分支: dev, feature/*
├── 域名: sora-codes-dev.vercel.app
├── 存储: upstash-redis-dev
└── 用途: 功能测试、集成测试

项目 B: sora-invite-codes
├── 分支: main
├── 域名: your-domain.com
├── 存储: upstash-redis-prod
└── 用途: 生产环境
```

### 方案 2: 单项目多分支策略

```
项目: sora-invite-codes
├── main 分支 → 生产环境 (upstash-redis-prod)
├── dev 分支 → 测试环境 (upstash-redis-dev)
└── feature/* 分支 → 预览环境 (upstash-redis-dev)
```

## 📊 存储选择建议

### 主要推荐: Upstash Redis

**优势:**
- ✅ 完美匹配键值存储需求
- ✅ 毫秒级响应时间
- ✅ 免费额度: 10,000 请求/天
- ✅ 自动扩展
- ✅ 与我们设计的持久化方案完美配合

**免费额度分析:**
- 邀请码项目预估: ~1,000 请求/天
- 存储需求: ~10MB
- **结论: 免费额度完全够用！**

### 备选方案: Neon Postgres

**适用场景:**
- 需要复杂查询
- 需要关系数据
- 需要 SQL 支持

**但邀请码项目用 Redis 更合适**

## 🔧 具体实施步骤

### 步骤 1: 创建 Upstash Redis 存储

1. **测试环境存储**
   - 点击 **Upstash** → **Create**
   - 名称: `sora-invite-codes-dev`
   - 区域: `us-east-1`
   - 记录连接信息

2. **生产环境存储**
   - 再次点击 **Upstash** → **Create**
   - 名称: `sora-invite-codes-prod`
   - 区域: `us-east-1`
   - 记录连接信息

### 步骤 2: 配置 Vercel 项目

1. **创建测试项目** (如果选择双项目策略)
   - 项目名: `sora-invite-codes-dev`
   - 连接 GitHub 仓库
   - 分支: `dev`

2. **配置生产项目**
   - 项目名: `sora-invite-codes`
   - 连接 GitHub 仓库
   - 分支: `main`

### 步骤 3: 设置环境变量

在各自的 Vercel 项目中设置对应的环境变量。

## 🚀 部署流程

### 开发 → 测试
```bash
# 1. 开发功能
git checkout dev
# ... 开发代码 ...
git add .
git commit -m "feat: add new feature"
git push origin dev

# 2. 自动部署到测试环境
# Vercel 自动检测 dev 分支并部署到测试环境
```

### 测试 → 生产
```bash
# 1. 测试通过后合并到主分支
git checkout main
git merge dev
git push origin main

# 2. 自动部署到生产环境
# Vercel 自动检测 main 分支并部署到生产环境
```

## 💰 成本分析

### Upstash Redis 免费额度
- **请求数**: 10,000/天
- **存储**: 256MB
- **带宽**: 1GB/天
- **连接数**: 30 并发

### 项目预估使用量
- **请求数**: ~1,000/天 (10% 使用率)
- **存储**: ~10MB (4% 使用率)
- **带宽**: ~100MB/天 (10% 使用率)

**结论: 完全在免费额度内！**

## 🔍 监控和维护

### 数据备份
```bash
# 定期备份生产数据
curl -X GET "https://your-prod-redis.upstash.io/get/invite_codes" \
  -H "Authorization: Bearer your-prod-token" > backup-$(date +%Y%m%d).json
```

### 环境切换测试
```bash
# 本地测试生产环境配置
vercel env pull .env.local --environment=production
npm run dev
```

### 监控指标
- 存储使用量
- 请求频率
- 响应时间
- 错误率

## 📈 扩展计划

### 短期 (1-3个月)
- ✅ 双环境部署
- ✅ 数据持久化
- ✅ 自动备份

### 中期 (3-6个月)
- 🔄 数据迁移工具
- 🔄 监控告警
- 🔄 性能优化

### 长期 (6个月+)
- 🔄 多区域部署
- 🔄 CDN 加速
- 🔄 高级分析
