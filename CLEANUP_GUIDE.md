# 数据清理机制使用指南

## 📋 目录
- [清理策略](#清理策略)
- [手动清理](#手动清理)
- [自动清理](#自动清理)
- [API 接口](#api-接口)
- [监控和统计](#监控和统计)

---

## 🎯 清理策略

### 默认清理规则

| 数据类型 | 条件 | 保留时间 | 说明 |
|---------|------|---------|------|
| **Used 邀请码** | 状态为 'used' | 7 天 | 已被成功使用的邀请码 |
| **Invalid 邀请码** | 状态为 'invalid' | 3 天 | 被标记为无效的邀请码 |
| **Inactive 邀请码** | 'active' 但无任何活动 | 30 天 | 长期无人使用的邀请码 |
| **用户统计** | 最后访问时间 | 90 天 | 不活跃用户的统计数据 |
| **孤立统计** | 邀请码已删除 | 立即 | 清理对应的 copy/vote 统计 |

### 配置参数

在 `lib/cleanup.ts` 中修改：

```typescript
const CLEANUP_CONFIG = {
  USED_CODE_RETENTION_DAYS: 7,        // Used 邀请码保留天数
  INVALID_CODE_RETENTION_DAYS: 3,     // Invalid 邀请码保留天数
  INACTIVE_CODE_DAYS: 30,             // Inactive 邀请码天数
  USER_STATS_RETENTION_DAYS: 90,      // 用户统计保留天数
  AUTO_CLEANUP_ENABLED: false,        // 是否启用自动清理
  AUTO_CLEANUP_INTERVAL_HOURS: 24,    // 自动清理间隔（小时）
}
```

---

## 🔧 手动清理

### 方法 1：通过 API 接口（推荐）

#### 1. 查看数据统计

```bash
curl http://localhost:3000/api/cleanup
```

**响应示例**：
```json
{
  "success": true,
  "stats": {
    "totalCodes": 15,
    "activeCodesCount": 8,
    "usedCodesCount": 5,
    "invalidCodesCount": 2,
    "totalUsers": 42,
    "oldestCode": {
      "code": "SORA-ABC123",
      "age": 15
    },
    "newestCode": {
      "code": "SORA-XYZ789",
      "age": 0
    },
    "config": { ... }
  }
}
```

#### 2. 试运行清理（不实际删除）

```bash
curl -X POST http://localhost:3000/api/cleanup \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-secret-key-change-me" \
  -d '{"action": "full", "dryRun": true}'
```

#### 3. 执行完整清理

```bash
curl -X POST http://localhost:3000/api/cleanup \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-secret-key-change-me" \
  -d '{"action": "full"}'
```

**响应示例**：
```json
{
  "success": true,
  "action": "full",
  "result": {
    "expiredCodes": {
      "removedCount": 3,
      "remainingCount": 12
    },
    "inactiveUsers": {
      "removedCount": 5
    },
    "orphanedStats": {
      "removedCount": 2
    },
    "duration": 145
  },
  "message": "Cleanup completed successfully"
}
```

#### 4. 只清理特定类型

##### 清理过期邀请码
```bash
curl -X POST http://localhost:3000/api/cleanup \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-secret-key-change-me" \
  -d '{"action": "expired"}'
```

##### 清理不活跃用户
```bash
curl -X POST http://localhost:3000/api/cleanup \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-secret-key-change-me" \
  -d '{"action": "users"}'
```

##### 清理孤立统计
```bash
curl -X POST http://localhost:3000/api/cleanup \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-secret-key-change-me" \
  -d '{"action": "orphaned"}'
```

### 方法 2：通过 Node.js 脚本

创建 `scripts/cleanup.js`：

```javascript
// scripts/cleanup.js
const { runFullCleanup, getDataStats } = require('../lib/cleanup')

console.log('Starting manual cleanup...')

// 显示清理前的统计
console.log('\n=== Before Cleanup ===')
console.log(JSON.stringify(getDataStats(), null, 2))

// 执行清理
const result = runFullCleanup()

// 显示清理后的统计
console.log('\n=== After Cleanup ===')
console.log(JSON.stringify(getDataStats(), null, 2))

console.log('\n=== Cleanup Result ===')
console.log(JSON.stringify(result, null, 2))
```

运行：
```bash
node scripts/cleanup.js
```

---

## ⚙️ 自动清理

### 启用自动清理

#### 方法 1：环境变量

在 `.env.local` 添加：
```bash
AUTO_CLEANUP=true
ADMIN_KEY=your-secure-admin-key-here
```

#### 方法 2：修改配置

在 `lib/cleanup.ts` 中：
```typescript
const CLEANUP_CONFIG = {
  AUTO_CLEANUP_ENABLED: true,
  AUTO_CLEANUP_INTERVAL_HOURS: 24,  // 每24小时清理一次
}
```

### 启动自动清理

在 `lib/data.ts` 底部添加：

```typescript
import { startAutoCleanup } from './cleanup'

// 启动自动清理（仅在服务器端）
if (typeof window === 'undefined') {
  startAutoCleanup()
}
```

### 停止自动清理

```typescript
import { stopAutoCleanup } from './cleanup'

stopAutoCleanup()
```

---

## 🔌 API 接口

### `GET /api/cleanup`

获取数据统计（无需认证）

**请求**：
```bash
curl http://localhost:3000/api/cleanup
```

**响应**：
```json
{
  "success": true,
  "stats": { ... }
}
```

---

### `POST /api/cleanup`

执行数据清理（需要管理员密钥）

**请求头**：
- `X-API-Key: <admin-key>` 或
- `Authorization: Bearer <admin-key>`

**请求体**：
```json
{
  "action": "full",      // full | expired | users | orphaned
  "dryRun": false        // true: 试运行，false: 实际执行
}
```

**响应**：
```json
{
  "success": true,
  "action": "full",
  "result": { ... },
  "message": "Cleanup completed successfully"
}
```

---

## 📊 监控和统计

### 在管理员页面查看

访问 `http://localhost:3000/admin/` 可以看到：
- 总邀请码数
- Active/Used/Invalid 状态分布
- 用户统计
- 最老/最新邀请码

### 命令行查看

```bash
# 查看统计
curl http://localhost:3000/api/cleanup | jq

# 查看所有邀请码
curl http://localhost:3000/api/analytics | jq '.allInviteCodes'

# 只看 used 邀请码
curl http://localhost:3000/api/analytics | jq '.allInviteCodes[] | select(.status == "used")'
```

---

## 🚀 部署时的清理策略

### Vercel 部署

由于 Vercel 文件系统是临时的，建议：

1. **使用数据库**（推荐）
   - 参考 `DATABASE_MIGRATION.md`
   - 使用 Vercel Postgres/Supabase

2. **定期备份**
   ```bash
   # 每天备份一次
   curl http://your-app.vercel.app/api/analytics > backup-$(date +%Y%m%d).json
   ```

3. **Vercel Cron Jobs**
   
   在 `vercel.json` 添加：
   ```json
   {
     "crons": [
       {
         "path": "/api/cleanup",
         "schedule": "0 2 * * *"
       }
     ]
   }
   ```
   
   然后修改 `/api/cleanup/route.ts`：
   ```typescript
   export async function POST(request: NextRequest) {
     // Vercel Cron 请求不需要认证
     const isCronJob = request.headers.get('x-vercel-cron') !== null
     
     if (!isCronJob && !verifyAdmin(request)) {
       return Response.json({ error: 'Unauthorized' }, { status: 401 })
     }
     
     // ... 清理逻辑
   }
   ```

### Railway/Render 部署

这些平台支持持久化存储，可以启用自动清理：

```bash
# .env
AUTO_CLEANUP=true
AUTO_CLEANUP_INTERVAL_HOURS=24
```

---

## ⚠️ 注意事项

1. **备份优先**
   - 清理前先备份 `data/` 文件夹
   - 使用 `dryRun: true` 测试

2. **管理员密钥安全**
   - 不要在代码中硬编码
   - 使用环境变量 `ADMIN_KEY`
   - 定期更换密钥

3. **清理时机**
   - 建议在访问量低的时段（凌晨 2-4 点）
   - 避免高峰期清理

4. **监控日志**
   ```bash
   # 查看清理日志
   tail -f /var/log/app.log | grep '\[Cleanup\]'
   ```

---

## 🆘 故障恢复

### 误删数据恢复

1. **从备份恢复**
   ```bash
   cp backup-20231015.json data/invite-codes.json
   ```

2. **从 Git 恢复**（如果提交了数据文件）
   ```bash
   git checkout HEAD~1 -- data/invite-codes.json
   ```

3. **从数据库恢复**（如果使用了数据库）
   ```sql
   -- 恢复特定时间点的数据
   SELECT * FROM invite_codes 
   WHERE created_at > '2023-10-01' 
   ORDER BY created_at DESC
   ```

---

## 📝 最佳实践

1. **定期清理**
   - 每周执行一次 `expired` 清理
   - 每月执行一次 `full` 清理

2. **监控数据量**
   - 设置告警：当邀请码超过 1000 条时
   - 定期查看 `/api/cleanup` 统计

3. **日志记录**
   - 保留清理日志至少 30 天
   - 记录每次清理的详细结果

4. **测试清理逻辑**
   ```bash
   # 先试运行
   curl -X POST http://localhost:3000/api/cleanup \
     -H "X-API-Key: admin-key" \
     -d '{"action": "full", "dryRun": true}'
   
   # 确认无误后再执行
   curl -X POST http://localhost:3000/api/cleanup \
     -H "X-API-Key: admin-key" \
     -d '{"action": "full"}'
   ```

