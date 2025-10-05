# Vercel 部署策略指南

## 🎯 推荐方案：双环境部署

### 环境架构

```
本地开发 → 文件存储 (data/*.json)
    ↓
测试环境 → Upstash Redis (dev)
    ↓
生产环境 → Upstash Redis (prod)
```

## 📋 实施步骤

### 步骤 1: 创建 Upstash Redis 存储

#### 测试环境存储
1. 在 Vercel Dashboard 中点击 **Upstash** → **Create**
2. 数据库名称: `sora-invite-codes-dev`
3. 区域选择: `us-east-1` (美国东部)
4. 记录连接信息:
   ```
   KV_REST_API_URL_DEV=https://xxx-dev.upstash.io
   KV_REST_API_TOKEN_DEV=xxx
   ```

#### 生产环境存储
1. 再次点击 **Upstash** → **Create**
2. 数据库名称: `sora-invite-codes-prod`
3. 区域选择: `us-east-1`
4. 记录连接信息:
   ```
   KV_REST_API_URL_PROD=https://xxx-prod.upstash.io
   KV_REST_API_TOKEN_PROD=xxx
   ```

### 步骤 2: 创建 Vercel 项目

#### 选项 A: 双项目策略 (推荐)
```
项目 1: sora-invite-codes-dev (测试)
├── 分支: dev, feature/*
├── 域名: sora-codes-dev.vercel.app
└── 存储: upstash-redis-dev

项目 2: sora-invite-codes (生产)
├── 分支: main
├── 域名: your-domain.com
└── 存储: upstash-redis-prod
```

#### 选项 B: 单项目多分支策略
```
项目: sora-invite-codes
├── main 分支 → 生产环境
├── dev 分支 → 测试环境
└── 根据分支自动切换存储
```

### 步骤 3: 环境变量配置

#### 测试环境 (.env.development)
```bash
# 测试环境
KV_REST_API_URL=https://xxx-dev.upstash.io
KV_REST_API_TOKEN=xxx-dev-token
NODE_ENV=development
VERCEL_ENV=development
```

#### 生产环境 (.env.production)
```bash
# 生产环境
KV_REST_API_URL=https://xxx-prod.upstash.io
KV_REST_API_TOKEN=xxx-prod-token
NODE_ENV=production
VERCEL_ENV=production
```

### 步骤 4: 更新代码配置

#### 修改 lib/persistence.ts
```typescript
// 根据环境自动选择存储配置
private createAdapter(): StorageAdapter {
  if (typeof window !== 'undefined') {
    return new LocalFileAdapter()
  }

  // 生产环境优先使用 Vercel KV
  if (process.env.VERCEL === '1' || process.env.KV_REST_API_URL) {
    try {
      return new VercelKVAdapter()
    } catch (error) {
      console.warn('[Persistence] Vercel KV not available, falling back to file storage')
    }
  }

  // 本地开发环境使用文件存储
  return new LocalFileAdapter()
}
```

## 🔧 部署配置

### vercel.json (根目录)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "KV_REST_API_URL": "@kv_rest_api_url",
    "KV_REST_API_TOKEN": "@kv_rest_api_token"
  },
  "build": {
    "env": {
      "KV_REST_API_URL": "@kv_rest_api_url",
      "KV_REST_API_TOKEN": "@kv_rest_api_token"
    }
  }
}
```

### package.json 脚本
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "deploy:dev": "vercel --env=development",
    "deploy:prod": "vercel --prod"
  }
}
```

## 🚀 部署流程

### 开发流程
```bash
# 1. 本地开发
npm run dev

# 2. 推送到 dev 分支
git checkout dev
git add .
git commit -m "feat: add new feature"
git push origin dev

# 3. 自动部署到测试环境
# Vercel 自动检测 dev 分支并部署
```

### 生产发布流程
```bash
# 1. 合并到 main 分支
git checkout main
git merge dev
git push origin main

# 2. 自动部署到生产环境
# Vercel 自动检测 main 分支并部署
```

## 📊 监控和维护

### 数据备份策略
```bash
# 定期备份生产数据
curl -X GET "https://xxx-prod.upstash.io/get/invite_codes" \
  -H "Authorization: Bearer xxx-prod-token" > backup-invite-codes.json
```

### 环境切换
```bash
# 切换到测试环境
vercel env pull .env.local --environment=development

# 切换到生产环境
vercel env pull .env.local --environment=production
```

## 💰 成本估算

### Upstash Redis 免费额度
- **请求数**: 10,000/天 (足够邀请码项目)
- **存储**: 256MB (足够存储大量邀请码)
- **带宽**: 1GB/天

### 预估使用量
- 邀请码项目: ~1000 请求/天
- 存储需求: ~10MB
- **结论**: 免费额度完全够用！

## 🔍 故障排除

### 常见问题
1. **环境变量未生效**: 检查 Vercel Dashboard 中的环境变量设置
2. **存储连接失败**: 验证 KV_REST_API_URL 和 TOKEN 是否正确
3. **数据不同步**: 检查网络连接和存储权限

### 调试命令
```bash
# 检查环境变量
vercel env ls

# 查看部署日志
vercel logs

# 本地测试生产环境
vercel env pull .env.local --environment=production
npm run dev
```

## 📈 扩展计划

### 未来优化
1. **数据迁移工具**: 自动在环境间同步数据
2. **监控告警**: 设置存储使用量监控
3. **自动备份**: 定期备份重要数据
4. **性能优化**: 缓存策略和查询优化
