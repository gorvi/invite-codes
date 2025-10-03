# 持久化存储设置指南

## 概述

本项目使用分层存储策略来确保数据在不同环境下的持久性：

- **生产环境 (Vercel)**: 使用 Vercel KV (Redis)
- **开发环境**: 使用本地文件存储
- **自动切换**: 根据环境变量自动选择合适的存储方式

## 1. Vercel KV 设置 (生产环境)

### 步骤 1: 创建 Vercel KV 存储

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Storage** 标签页
4. 点击 **Create Database** → 选择 **KV**
5. 输入数据库名称 (例如: `sora-invite-codes-kv`)
6. 选择区域 (推荐: `iad1` - 美国东部)
7. 点击 **Create**

### 步骤 2: 获取连接信息

创建完成后，你会看到：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### 步骤 3: 设置环境变量

在 Vercel 项目设置中添加环境变量：

```bash
KV_REST_API_URL=https://your-kv-url.upstash.io
KV_REST_API_TOKEN=your-kv-token
```

或者在本地开发时创建 `.env.local` 文件：

```bash
KV_REST_API_URL=https://your-kv-url.upstash.io
KV_REST_API_TOKEN=your-kv-token
```

## 2. 本地开发环境设置

本地开发环境会自动使用文件存储，无需额外配置。

数据文件会保存在：
- `data/invite-codes.json` - 邀请码数据
- `data/analytics.json` - 分析数据

## 3. 存储架构

### 数据模型

#### 邀请码 (InviteCode)
```typescript
{
  id: string
  code: string
  createdAt: Date
  status: 'active' | 'used' | 'invalid'
  votes: {
    worked: number
    didntWork: number
    uniqueWorked: number
    uniqueDidntWork: number
  }
  copiedCount: number
  uniqueCopiedCount: number
}
```

#### 分析数据 (AnalyticsData)
```typescript
{
  totalClicks: number
  copyClicks: number
  workedVotes: number
  didntWorkVotes: number
  submitCount: number
  gameStats: {
    globalBestScore: number
    totalGamesPlayed: number
    totalHamstersWhacked: number
  }
  dailyStats: Record<string, DailyStats>
  inviteCodeStats: Record<string, CodeStats>
  userStats: Record<string, UserStats>
  uniqueCopyStats: Record<string, UniqueCopyStats>
  uniqueVoteStats: Record<string, UniqueVoteStats>
}
```

### 存储键

#### Vercel KV
- `invite_codes` - 邀请码数组
- `analytics_data` - 分析数据对象

#### 本地文件
- `data/invite-codes.json` - 邀请码数据
- `data/analytics.json` - 分析数据

## 4. 使用方法

### 初始化数据
```typescript
import { initializeData } from '@/lib/data-new'

// 在 API 路由中
await initializeData()
```

### 保存数据
```typescript
import { saveData } from '@/lib/data-new'

// 自动保存所有数据
await saveData()
```

### 添加邀请码
```typescript
import { addInviteCode } from '@/lib/data-new'

const newCode = await addInviteCode('INVITE_CODE_123', 'username')
```

## 5. 故障排除

### 常见问题

#### 1. Vercel KV 连接失败
- 检查环境变量是否正确设置
- 确认 KV 数据库是否已创建
- 检查网络连接

#### 2. 本地文件权限错误
- 确保项目目录有写权限
- 检查 `data` 目录是否存在

#### 3. 数据不同步
- 检查存储类型: `persistenceManager.getStorageType()`
- 查看控制台日志确认数据加载/保存状态

### 调试日志

启用详细日志：
```typescript
console.log('Storage type:', persistenceManager.getStorageType())
console.log('Data loaded:', await persistenceManager.loadInviteCodes())
```

## 6. 数据迁移

### 从旧版本迁移

如果你有现有的数据需要迁移：

1. **导出旧数据**:
   ```bash
   # 从本地文件
   cp data/invite-codes.json backup-invite-codes.json
   cp data/analytics.json backup-analytics.json
   ```

2. **导入到新系统**:
   - 将数据文件放在项目根目录
   - 启动应用，新系统会自动加载数据
   - 数据会自动保存到新的存储系统

### 备份策略

- **Vercel KV**: 定期导出数据到本地文件
- **本地开发**: 定期备份 `data` 目录

## 7. 性能优化

### Vercel KV 优化
- 使用批量操作减少 API 调用
- 合理设置 TTL (Time To Live)
- 监控使用量和成本

### 本地文件优化
- 定期清理旧数据
- 使用文件锁避免并发写入问题

## 8. 监控和维护

### 监控指标
- 数据加载时间
- 保存成功率
- 存储使用量

### 维护任务
- 定期清理过期数据
- 监控存储成本
- 备份重要数据
