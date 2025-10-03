# 环境配置指南

## 🎯 针对 Upstash 限制的优化方案

### 限制分析
- ✅ **免费计划**：每个账户只能创建 **1 个数据库**
- ✅ **500,000 命令/月**：足够邀请码项目使用
- ✅ **256MB 存储**：完全够用

### 解决方案：单数据库多环境

## 🔧 Vercel 环境变量配置

### 在 Vercel Dashboard 设置环境变量

#### 生产环境 (Production)
```bash
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
VERCEL_ENV=production
NODE_ENV=production
```

#### 预览环境 (Preview) - 测试环境
```bash
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
VERCEL_ENV=preview
NODE_ENV=production
```

#### 开发环境 (Development) - 本地开发
```bash
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
VERCEL_ENV=development
NODE_ENV=development
```

## 📊 数据隔离策略

### Redis 键前缀方案

```
Redis 数据库中的键：
├── prod:invite_codes → 生产环境邀请码
├── prod:analytics_data → 生产环境统计数据
├── dev:invite_codes → 测试环境邀请码
├── dev:analytics_data → 测试环境统计数据
├── local:invite_codes → 本地开发邀请码
└── local:analytics_data → 本地开发统计数据
```

### 环境映射

| 环境 | VERCEL_ENV | 键前缀 | 用途 |
|------|------------|--------|------|
| 生产 | `production` | `prod:` | 正式发布 |
| 测试 | `preview` | `dev:` | 功能测试 |
| 本地 | `development` | `local:` | 本地开发 |

## 🚀 部署配置

### 方案 1：单项目多分支 (推荐)

```
项目: sora-invite-codes
├── main 分支 → 生产环境 (prod: 前缀)
├── dev 分支 → 测试环境 (dev: 前缀)
└── feature/* 分支 → 预览环境 (dev: 前缀)
```

**Vercel 自动部署配置：**
- `main` 分支 → `VERCEL_ENV=production`
- `dev` 分支 → `VERCEL_ENV=preview`
- `feature/*` 分支 → `VERCEL_ENV=preview`

### 方案 2：双项目共享数据库

```
项目 A: sora-invite-codes-dev
├── 分支: dev, feature/*
├── 环境变量: VERCEL_ENV=preview
└── 数据前缀: dev:

项目 B: sora-invite-codes
├── 分支: main
├── 环境变量: VERCEL_ENV=production
└── 数据前缀: prod:
```

## 💰 使用量分析

### 免费额度使用情况

**Upstash 免费计划：**
- 500,000 命令/月 = ~16,000 命令/天
- 256MB 存储空间
- 1GB 带宽/天

**项目预估使用量：**
- 读取操作：~500/天
- 写入操作：~50/天
- 存储使用：~1.5MB
- **使用率：3.4%** (完全够用！)

## 🔍 监控和管理

### 查看数据
```bash
# 查看所有键
redis-cli -u $KV_REST_API_URL KEYS "*"

# 查看生产环境数据
redis-cli -u $KV_REST_API_URL GET "prod:invite_codes"

# 查看测试环境数据
redis-cli -u $KV_REST_API_URL GET "dev:invite_codes"
```

### 数据备份
```bash
# 备份生产数据
curl -X GET "$KV_REST_API_URL/get/prod:invite_codes" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN" > backup-prod-$(date +%Y%m%d).json

# 备份测试数据
curl -X GET "$KV_REST_API_URL/get/dev:invite_codes" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN" > backup-dev-$(date +%Y%m%d).json
```

## 🎯 实施步骤

### 1. 创建 Upstash Redis 数据库
- 数据库名称：`sora-invite-codes`
- 区域：Washington, D.C., USA (East)
- 计划：Free
- 记录连接信息

### 2. 配置 Vercel 环境变量
- 进入项目设置 → Environment Variables
- 添加上述环境变量配置
- 确保不同环境使用不同的 `VERCEL_ENV` 值

### 3. 测试数据隔离
- 在测试环境提交邀请码
- 验证数据存储在 `dev:` 前缀下
- 确认生产环境数据不受影响

### 4. 部署验证
- 推送到 `dev` 分支测试
- 推送到 `main` 分支发布
- 验证数据正确隔离

## 💡 优势

✅ **成本最优**：只使用一个免费数据库
✅ **数据隔离**：通过键前缀完全隔离环境
✅ **易于管理**：统一管理界面
✅ **扩展性好**：未来可以轻松升级
✅ **监控简单**：所有数据在一个地方

## 🔮 未来升级路径

当项目增长时：
1. **升级到付费计划**：可以创建多个数据库
2. **多区域部署**：提高全球访问速度
3. **数据分片**：处理更大规模数据
4. **监控告警**：设置使用量监控
