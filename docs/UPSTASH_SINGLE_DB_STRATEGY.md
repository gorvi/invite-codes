# Upstash 单数据库策略指南

## 🚨 限制分析

**Upstash 免费计划限制：**
- ✅ 每个账户只能创建 **1 个数据库**
- ✅ 500,000 命令/月 (足够使用)
- ✅ 256MB 存储空间
- ✅ 1GB 带宽/天

## 🎯 推荐方案：单数据库多环境

### 方案设计

```
一个 Upstash Redis 数据库
├── 键前缀策略区分环境
│   ├── dev:* → 测试环境数据
│   ├── prod:* → 生产环境数据
│   └── local:* → 本地开发数据
└── 通过环境变量控制数据前缀
```

## 🔧 技术实现

### 1. 修改持久化管理器

```typescript
// lib/persistence.ts 修改
export class VercelKVAdapter implements StorageAdapter {
  private kv: any
  private keyPrefix: string

  constructor() {
    if (typeof window !== 'undefined' && (process.env.VERCEL === '1' || process.env.KV_REST_API_URL)) {
      this.kv = require('@vercel/kv').createClient({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      })
      
      // 根据环境设置键前缀
      this.keyPrefix = this.getKeyPrefix()
    }
  }

  private getKeyPrefix(): string {
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    
    switch (env) {
      case 'production':
        return 'prod:'
      case 'preview':
      case 'development':
        return 'dev:'
      default:
        return 'local:'
    }
  }

  private getKey(baseKey: string): string {
    return `${this.keyPrefix}${baseKey}`
  }

  async saveInviteCodes(codes: InviteCode[]): Promise<void> {
    if (!this.kv) throw new Error('Vercel KV not available')
    
    const key = this.getKey('invite_codes')
    const serializableCodes = codes.map(code => ({
      ...code,
      createdAt: code.createdAt.toISOString(),
    }))
    
    await this.kv.set(key, serializableCodes)
    console.log(`[KV] Saved invite codes to ${key}`)
  }

  async loadInviteCodes(): Promise<InviteCode[]> {
    if (!this.kv) throw new Error('Vercel KV not available')
    
    const key = this.getKey('invite_codes')
    const data = await this.kv.get(key)
    if (!data) return []
    
    return data.map((code: any) => ({
      ...code,
      createdAt: new Date(code.createdAt),
    }))
  }

  async saveAnalytics(analytics: AnalyticsData): Promise<void> {
    if (!this.kv) throw new Error('Vercel KV not available')
    
    const key = this.getKey('analytics_data')
    const serialized = this.serializeAnalytics(analytics)
    await this.kv.set(key, serialized)
    console.log(`[KV] Saved analytics data to ${key}`)
  }

  async loadAnalytics(): Promise<AnalyticsData | null> {
    if (!this.kv) throw new Error('Vercel KV not available')
    
    const key = this.getKey('analytics_data')
    const data = await this.kv.get(key)
    if (!data) return null
    
    return this.deserializeAnalytics(data)
  }
}
```

### 2. 环境配置

```bash
# 生产环境 (.env.production)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
VERCEL_ENV=production

# 测试环境 (.env.preview) 
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
VERCEL_ENV=preview

# 本地开发 (.env.local)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
VERCEL_ENV=development
```

### 3. 数据隔离示例

```
Redis 数据库中的键：
├── prod:invite_codes → 生产环境邀请码
├── prod:analytics_data → 生产环境统计数据
├── dev:invite_codes → 测试环境邀请码
├── dev:analytics_data → 测试环境统计数据
├── local:invite_codes → 本地开发邀请码
└── local:analytics_data → 本地开发统计数据
```

## 🚀 部署策略

### Vercel 项目配置

**方案 1：单项目多分支**
```
项目: sora-invite-codes
├── main 分支 → 生产环境 (prod: 前缀)
├── dev 分支 → 测试环境 (dev: 前缀)
└── feature/* 分支 → 预览环境 (dev: 前缀)
```

**方案 2：双项目共享数据库**
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

## 📊 使用量估算

### 免费额度分析
- **500,000 命令/月** = ~16,000 命令/天
- **邀请码项目预估**：
  - 读取操作：~500/天
  - 写入操作：~50/天
  - **总计：~550 命令/天**
  - **使用率：3.4%** (完全够用！)

### 存储空间分析
- **256MB 存储空间**
- **预估使用量**：
  - 每个邀请码：~1KB
  - 1000 个邀请码：~1MB
  - 统计数据：~0.5MB
  - **总计：~1.5MB** (使用率：0.6%)

## 🔍 监控和管理

### 数据查看工具
```bash
# 查看所有键
redis-cli -u $KV_REST_API_URL KEYS "*"

# 查看生产环境数据
redis-cli -u $KV_REST_API_URL GET "prod:invite_codes"

# 查看测试环境数据  
redis-cli -u $KV_REST_API_URL GET "dev:invite_codes"
```

### 数据备份策略
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

### 2. 更新代码
- 修改 `lib/persistence.ts` 支持键前缀
- 更新环境变量配置
- 测试数据隔离

### 3. 配置 Vercel
- 设置环境变量
- 配置分支部署
- 测试环境切换

## 💡 优势

✅ **成本最优**：只使用一个免费数据库
✅ **数据隔离**：通过键前缀完全隔离
✅ **易于管理**：统一管理界面
✅ **扩展性好**：未来可以轻松升级到付费计划
✅ **监控简单**：所有数据在一个地方

## 🔮 未来升级

当项目增长需要更多资源时：
- 升级到 Upstash 付费计划
- 可以创建多个数据库
- 迁移到真正的多环境架构
