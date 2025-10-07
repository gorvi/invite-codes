# Sora 2 Invite Codes - API 接口文档

## 目录
- [1. Dashboard API (仪表板接口)](#1-dashboard-api)
- [2. Invite Codes API (邀请码接口)](#2-invite-codes-api)
- [3. Analytics API (分析统计接口)](#3-analytics-api)
- [4. Vote API (投票接口)](#4-vote-api)
- [5. Game Stats API (游戏统计接口)](#5-game-stats-api)
- [6. SSE API (实时更新接口)](#6-sse-api)
- [7. Sensitive Words API (敏感词接口)](#7-sensitive-words-api)
- [8. SEO Monitor API (SEO监控接口)](#8-seo-monitor-api)
- [页面组件与接口映射](#页面组件与接口映射)
- [数据库表结构](#数据库表结构)

---

## 1. Dashboard API

### 接口信息
- **路径**: `/api/dashboard`
- **方法**: `GET`
- **文件**: `app/api/dashboard/route.ts`
- **描述**: 统一的仪表板接口，一次性返回所有邀请码相关的数据

### 输入参数
无

### 输出数据
```typescript
{
  // 邀请码数据
  allInviteCodes: InviteCode[],           // 所有邀请码（包括active、used、invalid）
  activeInviteCodes: InviteCode[],        // 仅活跃的邀请码
  
  // 统计数据
  activeCodeCount: number,                // 活跃邀请码数量
  totalCodeCount: number,                 // 总邀请码数量
  usedCodeCount: number,                  // 已使用邀请码数量
  invalidCodeCount: number,               // 无效邀请码数量
  successfullyUsedCount: number,          // 成功使用邀请码数量（unique_worked >= 4）
  
  // 总计数
  totalCopyCount: number,                 // 总复制次数
  totalUniqueCopyCount: number,           // 总独立复制次数
  totalWorkedVotes: number,               // 总"有效"投票数
  totalDidntWorkVotes: number,            // 总"无效"投票数
  submitCount: number,                    // 总提交数
  
  // 用户和每日统计
  userStats: {
    [userId: string]: {
      userId: string,
      copyCount: number,
      voteCount: number,
      submitCount: number,
      firstVisit: string,
      lastVisit: string
    }
  },
  dailyStats: {
    [date: string]: {
      date: string,
      copyClicks: number,
      workedVotes: number,
      didntWorkVotes: number,
      submitCount: number,
      uniqueVisitors: number
    }
  },
  
  // 元数据
  dataConsistency: {
    isConsistent: boolean,
    actualActiveCount: number,
    reportedActiveCount: number
  },
  lastUpdated: string,
  dataSource: string
}
```

### InviteCode 类型定义
```typescript
interface InviteCode {
  id: string,
  code: string,
  createdAt: Date,
  status: 'active' | 'used' | 'invalid',
  votes: {
    worked: number,           // 总"有效"投票数
    didntWork: number,        // 总"无效"投票数
    uniqueWorked: number,     // 独立"有效"投票数
    uniqueDidntWork: number   // 独立"无效"投票数
  },
  copiedCount: number,        // 总复制次数
  uniqueCopiedCount: number   // 独立复制次数
}
```

### 数据库表
- **主表**: `sora2_invite_codes`
- **关联表**: `sora2_user_stats`, `sora2_daily_stats`

### 使用场景
- **Active Sora 2 Codes**: 使用 `activeCodeCount`
- **Community Impact**: 使用 `totalCopyCount`, `totalWorkedVotes`, `submitCount`
- **Code List Display**: 使用 `activeInviteCodes`

---

## 2. Invite Codes API

### 2.1 获取活跃邀请码

#### 接口信息
- **路径**: `/api/invite-codes`
- **方法**: `GET`
- **文件**: `app/api/invite-codes/route.ts`
- **描述**: 获取所有活跃的邀请码

#### 输入参数
无

#### 输出数据
```typescript
InviteCode[]  // 仅返回 status='active' 的邀请码
```

### 2.2 提交新邀请码

#### 接口信息
- **路径**: `/api/invite-codes`
- **方法**: `POST`
- **文件**: `app/api/invite-codes/route.ts`
- **描述**: 提交一个新的邀请码

#### 输入参数
```typescript
{
  code: string,              // 必填，邀请码内容
  submitterName?: string     // 可选，提交者名称
}
```

#### 输出数据
成功（201）:
```typescript
{
  id: string,
  code: string,
  createdAt: Date,
  status: 'active',
  votes: {
    worked: 0,
    didntWork: 0,
    uniqueWorked: 0,
    uniqueDidntWork: 0
  },
  copiedCount: 0,
  uniqueCopiedCount: 0
}
```

失败（400）:
```typescript
{
  error: string,
  reason?: string,           // 敏感词校验失败原因
  matchedWords?: string[]    // 匹配到的敏感词
}
```

失败（409）:
```typescript
{
  error: 'This invite code already exists'
}
```

### 数据库表
- **主表**: `sora2_invite_codes`
- **字段**: `id`, `code`, `status`, `submitter_name`, `created_at`, `updated_at`, `worked_votes`, `didnt_work_votes`, `unique_worked_count`, `unique_didnt_work_count`, `copy_count`, `unique_copied_count`, `worked_user_ids`, `didnt_work_user_ids`, `copied_user_ids`

---

## 3. Analytics API

### 接口信息
- **路径**: `/api/analytics`
- **方法**: `POST`
- **文件**: `app/api/analytics/route.ts`
- **描述**: 记录用户的复制操作

### 输入参数
```typescript
{
  action: 'copy',            // 操作类型（目前只支持 'copy'）
  inviteCodeId: string,      // 邀请码ID
  userId?: string            // 可选，用户ID（如未提供会自动生成）
}
```

### 输出数据
成功（200）:
```typescript
{
  success: true,
  action: 'copy',
  timestamp: string,
  userId: string,
  totalCopies: number,       // 该邀请码的总复制次数
  uniqueCopies: number       // 该邀请码的独立复制次数
}
```

失败（404）:
```typescript
{
  error: 'Invite code not found'
}
```

### 数据库更新
1. **sora2_invite_codes 表**:
   - `copy_count`: 总复制次数 +1
   - `unique_copied_count`: 如果是新用户则 +1
   - `copied_user_ids`: 添加用户ID到数组

2. **sora2_user_stats 表**:
   - `copy_count`: 用户复制次数 +1
   - `last_visit`: 更新最后访问时间

### 重要说明
**⚠️ 独立计数 vs 总计数**:
- API 会同时更新两个计数：
  - **总计数** (`copy_count`): 每次点击都增加，无论是否同一用户
  - **独立计数** (`unique_copied_count`): 只有新用户点击时才增加
- **前端显示的是独立计数**，所以同一用户重复点击按钮时，前端显示的数字不会变化
- 这是正常行为，用于防止刷数据

### 使用场景
- **Copy Button**: 用户点击复制按钮时调用此接口

---

## 4. Vote API

### 接口信息
- **路径**: `/api/invite-codes/[id]/vote`
- **方法**: `POST`
- **文件**: `app/api/invite-codes/[id]/vote/route.ts`
- **描述**: 对邀请码进行投票（有效/无效）

### 输入参数
URL参数:
- `id`: 邀请码ID

Body参数:
```typescript
{
  vote: 'worked' | 'didntWork',  // 投票类型
  userId?: string                 // 可选，用户ID
}
```

### 输出数据
成功（200）:
```typescript
{
  id: string,
  code: string,
  status: 'active' | 'used' | 'invalid',
  createdAt: string,
  votes: {
    worked: number,           // 总"有效"投票数
    didntWork: number,        // 总"无效"投票数
    uniqueWorked: number,     // 独立"有效"投票数
    uniqueDidntWork: number   // 独立"无效"投票数
  },
  copiedCount: number,
  uniqueCopiedCount: number
}
```

失败（400）:
```typescript
{
  error: 'Invalid vote type'
}
```

失败（404）:
```typescript
{
  error: 'Invite code not found'
}
```

### 数据库更新
1. **sora2_invite_codes 表**:
   - `worked_votes` 或 `didnt_work_votes`: 总投票数 +1
   - `unique_worked_count` 或 `unique_didnt_work_count`: 如果是新用户则 +1
   - `worked_user_ids` 或 `didnt_work_user_ids`: 添加用户ID到数组
   - `status`: 根据投票数自动更新状态
     - 如果 `unique_worked_count >= 4`: 状态变为 `used`
     - 如果 `unique_didnt_work_count > unique_worked_count` 且 `unique_worked_count >= 2`: 状态变为 `invalid`

2. **sora2_user_stats 表**:
   - `vote_count`: 用户投票次数 +1
   - `last_visit`: 更新最后访问时间

### 重要说明
**⚠️ 独立计数 vs 总计数**:
- API 会同时更新两个计数：
  - **总投票数** (`worked_votes`, `didnt_work_votes`): 每次点击都增加
  - **独立投票数** (`unique_worked_count`, `unique_didnt_work_count`): 只有新用户点击时才增加
- **前端显示的是独立计数**，所以同一用户重复投票时，前端显示的数字不会变化
- 这是正常行为，用于防止刷数据和确保投票的真实性

### 使用场景
- **Worked Button**: 用户点击"有效"按钮时调用 `vote: 'worked'`
- **Didn't Work Button**: 用户点击"无效"按钮时调用 `vote: 'didntWork'`

---

## 5. Game Stats API

### 5.1 获取游戏统计

#### 接口信息
- **路径**: `/api/game-stats`
- **方法**: `GET`
- **文件**: `app/api/game-stats/route.ts`
- **描述**: 获取全局游戏统计数据

#### 输入参数
无

#### 输出数据
```typescript
{
  globalBestScore: number,      // 全局最佳分数
  totalGamesPlayed: number,     // 总游戏次数
  totalHamstersWhacked: number, // 总击打仓鼠数
  totalPlayers: number          // 总玩家数
}
```

### 5.2 提交游戏分数

#### 接口信息
- **路径**: `/api/game-stats`
- **方法**: `POST`
- **文件**: `app/api/game-stats/route.ts`
- **描述**: 提交游戏分数并更新统计

#### 输入参数
```typescript
{
  action: 'submit_score',
  score: number,              // 分数
  hamstersWhacked: number,    // 击打仓鼠数
  userId: string,             // 用户ID
  level?: number,             // 关卡
  gameDuration?: number       // 游戏时长（毫秒）
}
```

#### 输出数据
```typescript
{
  success: true,
  globalBestScore: number,
  totalGamesPlayed: number,
  totalHamstersWhacked: number,
  totalPlayers: number,
  personalBestScore: number,  // 个人最佳分数
  gameScoreId: string         // 游戏记录ID
}
```

### 数据库更新
1. **game_scores 表**: 保存游戏记录
2. **game_user_stats 表**: 更新用户统计
   - `totalGamesPlayed` +1
   - `totalHamstersWhacked` +击打数
   - `totalPlayTime` +游戏时长
   - `personalBestScore`: 如果新分数更高则更新

---

## 6. SSE API

### 接口信息
- **路径**: `/api/sse`
- **方法**: `GET`
- **文件**: `app/api/sse/route.ts`
- **描述**: Server-Sent Events 实时推送更新

### 输出数据流
事件类型1 - 初始数据:
```typescript
{
  type: 'initial',
  inviteCodes: InviteCode[]
}
```

事件类型2 - 新邀请码:
```typescript
{
  type: 'new_code',
  inviteCode: InviteCode
}
```

事件类型3 - 数据更新:
```typescript
{
  type: 'update',
  inviteCodes: InviteCode[]
}
```

### 使用场景
- **Real-time Updates**: 页面自动接收最新的邀请码数据
- **New Code Notifications**: 当有新邀请码提交时实时通知

---

## 7. Sensitive Words API

### 7.1 验证邀请码

#### 接口信息
- **路径**: `/api/sensitive-words/validate`
- **方法**: `POST`
- **文件**: `app/api/sensitive-words/validate/route.ts`
- **描述**: 验证邀请码是否包含敏感词

#### 输入参数
```typescript
{
  code: string  // 要验证的邀请码
}
```

#### 输出数据
```typescript
{
  isValid: boolean,
  reason?: string,
  matchedWords?: string[]
}
```

---

## 8. SEO Monitor API

### 接口信息
- **路径**: `/api/seo-monitor`
- **方法**: `GET`
- **文件**: `app/api/seo-monitor/route.ts`
- **描述**: 获取SEO监控数据

### 输入参数
```typescript
{
  url?: string  // 要监控的URL（可选）
}
```

### 输出数据
```typescript
{
  technicalSEO: {
    title: { value: string, status: string },
    metaDescription: { value: string, status: string },
    h1Count: { value: number, status: string },
    // ... 其他SEO指标
  },
  keywordAnalysis: {
    [keyword: string]: {
      exactMatches: number,
      density: string,
      totalWords: number
    }
  },
  // ... 其他SEO分析数据
}
```

---

## 页面组件与接口映射

### 1. Active Sora 2 Codes (活跃邀请码统计)
**组件**: `components/ActiveCodeStats.tsx`

**使用接口**: `/api/dashboard` (GET)

**使用字段**:
- `activeCodeCount`: 显示活跃邀请码数量

**显示位置**: 首页顶部统计卡片

---

### 2. Community Impact (社区影响统计)
**组件**: `components/CommunityImpact.tsx`

**使用接口**: `/api/dashboard` (GET)

**使用字段**:
- `submitCount`: 总提交数
- `totalCopyCount`: 总复制次数
- `totalWorkedVotes`: 总"有效"投票数

**显示位置**: 首页侧边栏

---

### 3. Invite Code List (邀请码列表)
**组件**: `components/InviteCodeDisplay.tsx`

**数据来源**: `app/page.tsx` 通过 `/api/dashboard` (GET) 获取

**使用字段**:
- `activeInviteCodes`: 活跃邀请码列表
- 每个邀请码的 `code`, `votes`, `copiedCount`, `uniqueCopiedCount`, `status`, `createdAt`

**显示位置**: 首页主要内容区

---

### 4. Copy Button (复制按钮)
**组件**: `components/InviteCodeDisplay.tsx`

**使用接口**: `/api/analytics` (POST)

**请求数据**:
```typescript
{
  action: 'copy',
  inviteCodeId: string
}
```

**更新字段**: `copy_count`, `unique_copied_count`, `copied_user_ids` (在 `sora2_invite_codes` 表)

---

### 5. Worked Button (有效按钮)
**组件**: `components/InviteCodeDisplay.tsx`

**使用接口**: `/api/invite-codes/[id]/vote` (POST)

**请求数据**:
```typescript
{
  vote: 'worked'
}
```

**更新字段**: `worked_votes`, `unique_worked_count`, `worked_user_ids` (在 `sora2_invite_codes` 表)

---

### 6. Didn't Work Button (无效按钮)
**组件**: `components/InviteCodeDisplay.tsx`

**使用接口**: `/api/invite-codes/[id]/vote` (POST)

**请求数据**:
```typescript
{
  vote: 'didntWork'
}
```

**更新字段**: `didnt_work_votes`, `unique_didnt_work_count`, `didnt_work_user_ids` (在 `sora2_invite_codes` 表)

---

## 数据库表结构

### 1. sora2_invite_codes (邀请码表)
```sql
CREATE TABLE sora2_invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active',          -- 'active', 'used', 'invalid'
  submitter_name TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  
  -- 投票统计
  worked_votes INTEGER DEFAULT 0,        -- 总"有效"投票数
  didnt_work_votes INTEGER DEFAULT 0,    -- 总"无效"投票数
  unique_worked_count INTEGER DEFAULT 0, -- 独立"有效"投票数
  unique_didnt_work_count INTEGER DEFAULT 0, -- 独立"无效"投票数
  worked_user_ids JSONB DEFAULT '[]',    -- "有效"投票用户ID列表
  didnt_work_user_ids JSONB DEFAULT '[]', -- "无效"投票用户ID列表
  
  -- 复制统计
  copy_count INTEGER DEFAULT 0,          -- 总复制次数
  unique_copied_count INTEGER DEFAULT 0, -- 独立复制次数
  copied_user_ids JSONB DEFAULT '[]'     -- 复制用户ID列表
);
```

### 2. sora2_user_stats (用户统计表)
```sql
CREATE TABLE sora2_user_stats (
  user_id TEXT PRIMARY KEY,
  copy_count INTEGER DEFAULT 0,          -- 用户总复制次数
  vote_count INTEGER DEFAULT 0,          -- 用户总投票次数
  submit_count INTEGER DEFAULT 0,        -- 用户总提交次数
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

### 3. sora2_daily_stats (每日统计视图)
```sql
CREATE VIEW sora2_daily_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as submit_count,
  SUM(copy_count) as copy_clicks,
  SUM(worked_votes) as worked_votes,
  SUM(didnt_work_votes) as didnt_work_votes,
  COUNT(DISTINCT submitter_name) as unique_submitters
FROM sora2_invite_codes
GROUP BY DATE(created_at);
```

---

## 接口总结

| 序号 | 接口路径 | 方法 | 用途 | 文件 |
|------|---------|------|------|------|
| 1 | `/api/dashboard` | GET | 获取所有仪表板数据 | `app/api/dashboard/route.ts` |
| 2 | `/api/invite-codes` | GET | 获取活跃邀请码 | `app/api/invite-codes/route.ts` |
| 3 | `/api/invite-codes` | POST | 提交新邀请码 | `app/api/invite-codes/route.ts` |
| 4 | `/api/invite-codes/[id]/vote` | POST | 投票（有效/无效） | `app/api/invite-codes/[id]/vote/route.ts` |
| 5 | `/api/analytics` | POST | 记录复制操作 | `app/api/analytics/route.ts` |
| 6 | `/api/game-stats` | GET | 获取游戏统计 | `app/api/game-stats/route.ts` |
| 7 | `/api/game-stats` | POST | 提交游戏分数 | `app/api/game-stats/route.ts` |
| 8 | `/api/sse` | GET | 实时数据推送 | `app/api/sse/route.ts` |
| 9 | `/api/sensitive-words/validate` | POST | 验证敏感词 | `app/api/sensitive-words/validate/route.ts` |
| 10 | `/api/seo-monitor` | GET | SEO监控数据 | `app/api/seo-monitor/route.ts` |

**总计**: 10个接口（8个不同路径）

---

## 关键数据流

### 1. 用户复制邀请码
1. 用户点击 Copy 按钮
2. 调用 `/api/analytics` (POST) 记录复制
3. 更新 `sora2_invite_codes.copy_count` 和 `unique_copied_count`
4. 更新 `sora2_user_stats.copy_count`
5. 前端刷新数据，显示更新后的数字

### 2. 用户投票
1. 用户点击 Worked 或 Didn't Work 按钮
2. 调用 `/api/invite-codes/[id]/vote` (POST)
3. 更新 `sora2_invite_codes` 的投票字段
4. 根据投票数自动更新邀请码状态
5. 更新 `sora2_user_stats.vote_count`
6. 前端刷新数据，显示更新后的数字

### 3. 页面加载
1. 页面加载时调用 `/api/dashboard` (GET)
2. 获取所有统计数据和邀请码列表
3. 渲染各个组件：
   - ActiveCodeStats 显示活跃邀请码数量
   - CommunityImpact 显示社区统计
   - InviteCodeDisplay 显示邀请码列表
4. 建立 SSE 连接接收实时更新

---

## 注意事项

1. **用户标识**: 所有需要追踪用户的接口都会自动生成用户标识（基于 IP + User-Agent + 日期）
2. **独立统计**: `unique_*` 字段用于统计独立用户数，通过 JSONB 数组存储用户ID列表
3. **状态自动更新**: 邀请码状态会根据投票数自动更新
4. **缓存控制**: Dashboard API 使用 `no-cache` 头确保数据实时性
5. **敏感词过滤**: 所有提交的邀请码都会经过敏感词验证

---

## 常见问题 FAQ

### Q1: 为什么点击按钮后数字没有变化？

**A**: 这是正常行为！前端显示的是**独立计数**，不是总计数。

**详细说明**:
- 数据库中存储了两种计数：
  - **总计数** (`copy_count`, `worked_votes`, `didnt_work_votes`): 每次点击都增加
  - **独立计数** (`unique_copied_count`, `unique_worked_count`, `unique_didnt_work_count`): 只有新用户点击时才增加
- **前端显示独立计数**，目的是防止数据作假和刷数据
- 如果您（同一个用户/IP）重复点击按钮，总计数会增加，但独立计数不变，所以前端显示的数字不变

**验证方法**:
```bash
# 检查数据库中的实际数据
GET /api/dashboard

# 查看某个邀请码的数据
{
  "code": "FFAADD",
  "copiedCount": 20,              // 总复制次数（每次点击都增加）
  "uniqueCopiedCount": 12,        // 独立复制次数（只有新用户才增加）✅ 前端显示这个
  "votes": {
    "worked": 5,                  // 总有效投票（每次点击都增加）
    "uniqueWorked": 2,            // 独立有效投票（只有新用户才增加）✅ 前端显示这个
    "didntWork": 8,
    "uniqueDidntWork": 3          // ✅ 前端显示这个
  }
}
```

### Q2: 如何测试按钮功能？

**A**: 使用不同的浏览器或清除浏览器数据。

由于用户标识是基于 `IP + User-Agent + 日期` 生成的，要测试独立计数增加，您需要：

**方法1 - 使用不同浏览器**:
- Chrome 浏览器点击 → 独立计数 +1
- Firefox 浏览器点击 → 独立计数 +1
- Safari 浏览器点击 → 独立计数 +1

**方法2 - 使用隐私/无痕模式**:
- 普通模式点击 → 独立计数 +1
- 隐私模式点击 → 独立计数 +1

**方法3 - 更换网络/设备**:
- 电脑点击 → 独立计数 +1
- 手机点击 → 独立计数 +1

### Q3: 这样设计的目的是什么？

**A**: 防止数据作假，确保统计的真实性。

**设计理由**:
1. **防止刷数据**: 如果显示总计数，一个用户可以疯狂点击让数字飙升
2. **真实反馈**: 独立计数反映了真实的用户参与度
3. **邀请码质量**: 多个独立用户验证的邀请码更可信
4. **状态判断**: 邀请码状态（active/used/invalid）基于独立投票数判断
   - `unique_worked_count >= 4` → 状态变为 `used`
   - `unique_didnt_work_count > unique_worked_count` 且 `unique_worked_count >= 2` → 状态变为 `invalid`

### Q4: 总计数有什么用？

**A**: 总计数用于后台分析和调试。

虽然前端不显示总计数，但它们在数据库中保存，可用于：
- 分析用户重复操作行为
- 检测异常流量
- 调试问题（如本次问题排查）
- 统计总体互动次数

---

*文档最后更新: 2025-10-07*

