# 数据流示例 - DAQF7K 邀请码

## 问题
DAQF7K 在生产环境网站显示的数量是：
- **Copied**: 3
- **Worked**: 0  
- **Didn't Work**: 2

这些数字是怎么获取的？存储在数据库的哪里？

---

## 数据来源追踪

### 1. 前端显示
**页面**: https://www.invitecodes.net/

**组件**: `components/InviteCodeDisplay.tsx`

**显示的数字**:
```typescript
<span>{getDisplayValue(code, 'copy')} copied</span>           // 显示: 3
<span>{getDisplayValue(code, 'worked')}</span>                 // 显示: 0
<span>{getDisplayValue(code, 'didntWork')}</span>              // 显示: 2
```

### 2. 数据获取
**接口**: `/api/dashboard` (GET)

**调用位置**: `app/page.tsx` 第 33-59 行
```typescript
const handleManualRefresh = async () => {
  const response = await fetch(`/api/dashboard?t=${timestamp}`)
  const dashboardData = await response.json()
  const activeInviteCodes = dashboardData.activeInviteCodes
  setInviteCodes(activeInviteCodes)  // 设置到组件状态
}
```

### 3. API 处理
**文件**: `app/api/dashboard/route.ts`

**查询逻辑** (第 23-27 行):
```typescript
const { data, error } = await supabase
  .from('sora2_invite_codes')
  .select('*')
  .order('created_at', { ascending: false })
```

**数据转换** (第 90-103 行):
```typescript
const formattedInviteCodes = allInviteCodes.map((row: any) => ({
  id: row.id,
  code: row.code,
  votes: {
    worked: row.worked_votes,                    // 总投票数（不显示）
    didntWork: row.didnt_work_votes,            // 总投票数（不显示）
    uniqueWorked: row.unique_worked_count,      // ✅ 前端显示这个
    uniqueDidntWork: row.unique_didnt_work_count // ✅ 前端显示这个
  },
  copiedCount: row.copy_count,                   // 总复制数（不显示）
  uniqueCopiedCount: row.unique_copied_count     // ✅ 前端显示这个
}))
```

### 4. 数据库表
**表名**: `sora2_invite_codes`

**DAQF7K 的记录**:
```sql
SELECT * FROM sora2_invite_codes WHERE code = 'DAQF7K';
```

**查询结果**:
```
id: 17595618393401c4vaoq6n
code: DAQF7K
status: active
created_at: 2025-10-04T07:10:39.340Z

-- 复制统计
copy_count: 5                      -- 总复制次数（后台记录）
unique_copied_count: 3             -- ✅ 网站显示: 3 copied

-- 投票统计
worked_votes: 0                    -- 总"有效"投票（后台记录）
unique_worked_count: 0             -- ✅ 网站显示: 0 worked

didnt_work_votes: 2                -- 总"无效"投票（后台记录）
unique_didnt_work_count: 2         -- ✅ 网站显示: 2 didn't work

-- 用户ID列表（JSONB 数组）
copied_user_ids: ["user1", "user2", "user3"]           -- 3个独立用户复制
worked_user_ids: []                                     -- 0个独立用户投"有效"
didnt_work_user_ids: ["userA", "userB"]                -- 2个独立用户投"无效"
```

---

## 完整数据流

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 用户访问网站 https://www.invitecodes.net/               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. app/page.tsx 调用 handleManualRefresh()                 │
│    → fetch('/api/dashboard')                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. app/api/dashboard/route.ts                              │
│    → supabase.from('sora2_invite_codes').select('*')       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Supabase 数据库                                          │
│    表: sora2_invite_codes                                   │
│    记录 ID: 17595618393401c4vaoq6n                         │
│    ┌──────────────────────────────────────────────────┐    │
│    │ code: "DAQF7K"                                   │    │
│    │ copy_count: 5            (总数，不显示)          │    │
│    │ unique_copied_count: 3   (✅ 显示在前端)         │    │
│    │ worked_votes: 0          (总数，不显示)          │    │
│    │ unique_worked_count: 0   (✅ 显示在前端)         │    │
│    │ didnt_work_votes: 2      (总数，不显示)          │    │
│    │ unique_didnt_work_count: 2 (✅ 显示在前端)       │    │
│    └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. API 返回格式化数据                                       │
│    {                                                        │
│      code: "DAQF7K",                                        │
│      uniqueCopiedCount: 3,        ← 从 unique_copied_count │
│      votes: {                                               │
│        uniqueWorked: 0,           ← 从 unique_worked_count │
│        uniqueDidntWork: 2         ← 从 unique_didnt_work_count │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. components/InviteCodeDisplay.tsx                         │
│    getDisplayValue(code, 'copy')       → 返回: 3           │
│    getDisplayValue(code, 'worked')     → 返回: 0           │
│    getDisplayValue(code, 'didntWork')  → 返回: 2           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. 用户看到的界面                                           │
│    ┌────────────────────────────────────────────────┐      │
│    │ DAQF7K                                         │      │
│    │ [Copy Code] [Worked] [Didn't Work]             │      │
│    │ 3 copied  |  0  |  2                           │      │
│    └────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 字段对应关系

| 网站显示 | 前端代码 | API 字段 | 数据库字段 | DAQF7K 的值 |
|---------|---------|---------|-----------|------------|
| **3 copied** | `code.uniqueCopiedCount` | `uniqueCopiedCount` | `unique_copied_count` | 3 |
| **0 worked** | `code.votes.uniqueWorked` | `votes.uniqueWorked` | `unique_worked_count` | 0 |
| **2 didn't work** | `code.votes.uniqueDidntWork` | `votes.uniqueDidntWork` | `unique_didnt_work_count` | 2 |

---

## 数据库记录示例

### 使用 Supabase Dashboard 查询

1. 登录 Supabase Dashboard
2. 选择项目
3. 进入 "Table Editor"
4. 选择 `sora2_invite_codes` 表
5. 搜索 `code = 'DAQF7K'`

**查询结果**:
```json
{
  "id": "17595618393401c4vaoq6n",
  "code": "DAQF7K",
  "status": "active",
  "submitter_name": "Anonymous",
  "created_at": "2025-10-04T07:10:39.340Z",
  "updated_at": "2025-10-06T15:40:47.384Z",
  
  "copy_count": 5,
  "unique_copied_count": 3,              ← 网站显示: "3 copied"
  "copied_user_ids": ["OjoxLU1vemlsbGEv", "MTUwLjI0MS4yMTAu", "ODYuMTYuMTk5Ljk1"],
  
  "worked_votes": 0,
  "unique_worked_count": 0,              ← 网站显示: "0 worked"
  "worked_user_ids": [],
  
  "didnt_work_votes": 2,
  "unique_didnt_work_count": 2,          ← 网站显示: "2 didn't work"
  "didnt_work_user_ids": ["OjoxLU1vemlsbGEv", "MTYwLjMwLjEyMS44"]
}
```

---

## SQL 查询语句

如果您想直接查询数据库：

```sql
-- 查询 DAQF7K 的完整记录
SELECT 
  id,
  code,
  status,
  copy_count,
  unique_copied_count,        -- ✅ 网站显示这个
  worked_votes,
  unique_worked_count,        -- ✅ 网站显示这个
  didnt_work_votes,
  unique_didnt_work_count,    -- ✅ 网站显示这个
  copied_user_ids,
  worked_user_ids,
  didnt_work_user_ids,
  created_at,
  updated_at
FROM sora2_invite_codes
WHERE code = 'DAQF7K';
```

**结果**:
```
id                    : 17595618393401c4vaoq6n
code                  : DAQF7K
status                : active
copy_count            : 5
unique_copied_count   : 3        ← 显示: "3 copied"
worked_votes          : 0
unique_worked_count   : 0        ← 显示: "0 worked"
didnt_work_votes      : 2
unique_didnt_work_count: 2       ← 显示: "2 didn't work"
copied_user_ids       : ["OjoxLU1vemlsbGEv", "MTUwLjI0MS4yMTAu", "ODYuMTYuMTk5Ljk1"]
worked_user_ids       : []
didnt_work_user_ids   : ["OjoxLU1vemlsbGEv", "MTYwLjMwLjEyMS44"]
created_at            : 2025-10-04 07:10:39.340+00
updated_at            : 2025-10-06 15:40:47.384+00
```

---

## 总结

**DAQF7K 显示的 "3, 0, 2" 来自**:

1. **数据库**: Supabase → `sora2_invite_codes` 表
2. **记录 ID**: `17595618393401c4vaoq6n`
3. **具体字段**:
   - `3 copied` ← `unique_copied_count` 字段
   - `0 worked` ← `unique_worked_count` 字段
   - `2 didn't work` ← `unique_didnt_work_count` 字段

4. **数据流**:
   ```
   数据库 → API (/api/dashboard) → 前端 (app/page.tsx) → 组件 (InviteCodeDisplay.tsx) → 用户界面
   ```

5. **关键点**:
   - 前端显示的是**独立计数**（unique count）
   - 数据库同时存储**总计数**（total count）和**独立计数**（unique count）
   - 独立计数通过 `*_user_ids` JSONB 数组来追踪唯一用户

---

*文档创建日期: 2025-10-07*

