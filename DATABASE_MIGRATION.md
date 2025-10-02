# 数据库迁移方案

## 🎯 目标：从文件存储迁移到 Vercel Postgres

### 第一步：创建数据库表结构

```sql
-- 邀请码表
CREATE TABLE invite_codes (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  votes_worked INT DEFAULT 0,
  votes_didnt_work INT DEFAULT 0,
  votes_unique_worked INT DEFAULT 0,
  votes_unique_didnt_work INT DEFAULT 0,
  copied_count INT DEFAULT 0,
  unique_copied_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- 独立投票者表（追踪唯一用户）
CREATE TABLE unique_voters (
  id SERIAL PRIMARY KEY,
  invite_code_id VARCHAR(50) REFERENCES invite_codes(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  vote_type VARCHAR(20) NOT NULL, -- 'worked' or 'didntWork'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(invite_code_id, user_id, vote_type)
);

-- 独立复制者表
CREATE TABLE unique_copiers (
  id SERIAL PRIMARY KEY,
  invite_code_id VARCHAR(50) REFERENCES invite_codes(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(invite_code_id, user_id)
);

-- 用户统计表
CREATE TABLE user_stats (
  user_id VARCHAR(100) PRIMARY KEY,
  copy_count INT DEFAULT 0,
  vote_count INT DEFAULT 0,
  submit_count INT DEFAULT 0,
  first_visit TIMESTAMP DEFAULT NOW(),
  last_visit TIMESTAMP DEFAULT NOW()
);

-- 游戏统计表
CREATE TABLE game_stats (
  id INT PRIMARY KEY DEFAULT 1,
  global_best_score INT DEFAULT 0,
  total_games_played INT DEFAULT 0,
  total_hamsters_whacked INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 每日统计表
CREATE TABLE daily_stats (
  date DATE PRIMARY KEY,
  copy_count INT DEFAULT 0,
  vote_count INT DEFAULT 0,
  submit_count INT DEFAULT 0
);

-- 创建索引以优化查询
CREATE INDEX idx_invite_codes_status ON invite_codes(status);
CREATE INDEX idx_invite_codes_created_at ON invite_codes(created_at DESC);
CREATE INDEX idx_unique_voters_code ON unique_voters(invite_code_id);
CREATE INDEX idx_unique_copiers_code ON unique_copiers(invite_code_id);
```

### 第二步：修改 lib/data.ts

```typescript
// lib/db.ts (新文件)
import { sql } from '@vercel/postgres'

export async function getInviteCodes(status: string = 'active') {
  const { rows } = await sql`
    SELECT * FROM invite_codes 
    WHERE status = ${status}
    ORDER BY created_at DESC
  `
  return rows
}

export async function addInviteCode(code: any) {
  await sql`
    INSERT INTO invite_codes (id, code, status, created_at, submitted_at)
    VALUES (${code.id}, ${code.code}, ${code.status}, ${code.createdAt}, ${code.submittedAt})
  `
}

export async function updateInviteCodeVote(codeId: string, userId: string, voteType: string) {
  // 检查是否已投票
  const { rows } = await sql`
    SELECT * FROM unique_voters 
    WHERE invite_code_id = ${codeId} AND user_id = ${userId} AND vote_type = ${voteType}
  `
  
  const isNewVote = rows.length === 0
  
  // 插入唯一投票记录（如果是新投票）
  if (isNewVote) {
    await sql`
      INSERT INTO unique_voters (invite_code_id, user_id, vote_type)
      VALUES (${codeId}, ${userId}, ${voteType})
      ON CONFLICT DO NOTHING
    `
  }
  
  // 更新邀请码统计
  if (voteType === 'worked') {
    await sql`
      UPDATE invite_codes 
      SET votes_worked = votes_worked + 1,
          votes_unique_worked = (
            SELECT COUNT(DISTINCT user_id) FROM unique_voters 
            WHERE invite_code_id = ${codeId} AND vote_type = 'worked'
          )
      WHERE id = ${codeId}
    `
  } else {
    await sql`
      UPDATE invite_codes 
      SET votes_didnt_work = votes_didnt_work + 1,
          votes_unique_didnt_work = (
            SELECT COUNT(DISTINCT user_id) FROM unique_voters 
            WHERE invite_code_id = ${codeId} AND vote_type = 'didntWork'
          )
      WHERE id = ${codeId}
    `
  }
  
  // 检查状态更新
  const { rows: codeRows } = await sql`
    SELECT votes_unique_worked, votes_unique_didnt_work FROM invite_codes WHERE id = ${codeId}
  `
  
  const code = codeRows[0]
  let newStatus = 'active'
  
  if (code.votes_unique_worked >= 4) {
    newStatus = 'used'
  } else if (code.votes_unique_didnt_work > code.votes_unique_worked && code.votes_unique_worked >= 2) {
    newStatus = 'invalid'
  }
  
  if (newStatus !== 'active') {
    await sql`UPDATE invite_codes SET status = ${newStatus} WHERE id = ${codeId}`
  }
  
  return { isNewVote, newStatus }
}
```

### 第三步：修改 API Routes

```typescript
// app/api/invite-codes/route.ts
import { getInviteCodes, addInviteCode } from '@/lib/db'

export async function GET() {
  const codes = await getInviteCodes('active')
  return Response.json(codes)
}

export async function POST(request: Request) {
  const { code } = await request.json()
  
  const newCode = {
    id: Date.now().toString(),
    code: code.toUpperCase(),
    status: 'active',
    createdAt: new Date(),
    submittedAt: new Date()
  }
  
  await addInviteCode(newCode)
  
  return Response.json({ success: true, code: newCode })
}
```

### 第四步：环境变量配置

在 Vercel 项目设置中添加：

```bash
# .env.local (本地开发)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"
```

### 第五步：数据迁移脚本

```typescript
// scripts/migrate-data.ts
import fs from 'fs'
import { sql } from '@vercel/postgres'

async function migrateData() {
  // 读取现有文件数据
  const codes = JSON.parse(fs.readFileSync('data/invite-codes.json', 'utf-8'))
  
  // 插入到数据库
  for (const code of codes) {
    await sql`
      INSERT INTO invite_codes (id, code, status, votes_worked, votes_didnt_work, created_at)
      VALUES (${code.id}, ${code.code}, ${code.status}, ${code.votes.worked}, ${code.votes.didntWork}, ${code.createdAt})
      ON CONFLICT (id) DO NOTHING
    `
  }
  
  console.log(`Migrated ${codes.length} invite codes`)
}

migrateData()
```

## 🚀 部署步骤

1. **在 Vercel 创建项目**
2. **添加 Postgres 数据库**
   - Dashboard → Storage → Create Database → Postgres
3. **运行数据库初始化脚本**（在 Vercel SQL 编辑器中）
4. **部署项目**
   - `git push` → 自动部署
5. **（可选）迁移现有数据**
   - 运行 `migrate-data.ts` 脚本

## ⚠️ 注意事项

1. **Vercel Postgres 免费额度**：
   - 60 小时计算时间/月
   - 256 MB 存储
   - 1 GB 数据传输

2. **连接池**：使用 `@vercel/postgres` 自动管理

3. **备份**：定期导出数据
   ```bash
   # 导出所有数据
   vercel env pull .env.local
   pg_dump $POSTGRES_URL > backup.sql
   ```

## 📊 数据库 vs 文件存储对比

| 特性 | 文件存储 | Vercel Postgres |
|------|---------|----------------|
| 持久化 | ❌ 部署时丢失 | ✅ 永久保存 |
| 并发写入 | ⚠️ 可能冲突 | ✅ 事务保证 |
| 查询性能 | ⚠️ 读取整个文件 | ✅ SQL 索引优化 |
| 数据完整性 | ⚠️ 手动管理 | ✅ 外键约束 |
| 扩展性 | ❌ 单文件限制 | ✅ 海量数据 |
| 备份恢复 | ⚠️ 手动复制 | ✅ 自动备份 |

## 🔄 回滚方案

如果数据库出问题，可以快速回滚到文件存储：

1. 保留 `lib/storage.ts`
2. 使用环境变量切换：
   ```typescript
   const USE_DATABASE = process.env.USE_DATABASE === 'true'
   
   if (USE_DATABASE) {
     // 使用数据库
   } else {
     // 使用文件存储
   }
   ```

