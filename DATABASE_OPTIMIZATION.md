# 数据库结构优化方案

## 🚨 当前问题分析

### 问题 1: `userStats` JSONB 字段
- **问题**: 所有用户统计数据存储在一个 JSONB 字段中
- **影响**: 
  - 用户增长时字段变得巨大
  - 并发更新冲突严重
  - 查询性能差
  - 无法有效索引

### 问题 2: `daily_stats` JSONB 字段
- **问题**: 所有每日统计数据存储在一个 JSONB 字段中
- **影响**:
  - 时间推移数据累积，字段越来越大
  - 实时更新频繁，并发冲突
  - 无法进行有效的时序分析

## 🔧 优化方案

### 新表结构设计

#### 1. `sora2_invite_codes` (保持不变)
```sql
-- 邀请码实体表，设计合理，保持不变
CREATE TABLE sora2_invite_codes (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  -- ... 其他字段
);
```

#### 2. `sora2_analytics` (简化)
```sql
-- 只存储真正的全局聚合数据
CREATE TABLE sora2_analytics (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_submit_count INTEGER DEFAULT 0,
  total_copy_clicks INTEGER DEFAULT 0,
  total_worked_votes INTEGER DEFAULT 0,
  total_didnt_work_votes INTEGER DEFAULT 0,
  total_unique_users INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `sora2_user_stats` (新增)
```sql
-- 用户统计表，替代 userStats JSONB
CREATE TABLE sora2_user_stats (
  user_id VARCHAR(255) PRIMARY KEY,
  copy_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  submit_count INTEGER DEFAULT 0,
  first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `sora2_daily_stats` (新增)
```sql
-- 每日统计表，替代 daily_stats JSONB
CREATE TABLE sora2_daily_stats (
  date DATE PRIMARY KEY,
  submit_count INTEGER DEFAULT 0,
  copy_clicks INTEGER DEFAULT 0,
  worked_votes INTEGER DEFAULT 0,
  didnt_work_votes INTEGER DEFAULT 0,
  unique_users_visited INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. `sora2_hourly_stats` (可选)
```sql
-- 每小时统计表，用于更细粒度分析
CREATE TABLE sora2_hourly_stats (
  date_hour TIMESTAMP WITH TIME ZONE PRIMARY KEY,
  date DATE NOT NULL,
  hour INTEGER NOT NULL,
  submit_count INTEGER DEFAULT 0,
  copy_clicks INTEGER DEFAULT 0,
  worked_votes INTEGER DEFAULT 0,
  didnt_work_votes INTEGER DEFAULT 0,
  unique_users_visited INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📊 优化效果对比

### 性能提升
| 指标 | 旧设计 | 新设计 | 提升 |
|------|--------|--------|------|
| 并发写入 | ❌ 单行冲突 | ✅ 多行并行 | 10x+ |
| 查询性能 | ❌ 解析 JSONB | ✅ 直接索引 | 5x+ |
| 数据一致性 | ❌ 容易冲突 | ✅ 原子操作 | 显著提升 |
| 扩展性 | ❌ 字段无限增长 | ✅ 表结构扩展 | 无限 |

### 存储优化
| 数据类型 | 旧设计 | 新设计 | 优势 |
|----------|--------|--------|------|
| 用户统计 | 1个巨大 JSONB | N个独立行 | 可索引、可分区 |
| 每日统计 | 1个累积 JSONB | 按日期分区 | 可归档、可清理 |
| 查询效率 | 全表扫描 JSONB | 索引查询 | 大幅提升 |

## 🔄 迁移策略

### 阶段 1: 创建新表结构
```sql
-- 1. 创建新表（不影响现有数据）
-- 2. 设置 RLS 策略
-- 3. 创建索引
```

### 阶段 2: 数据迁移
```sql
-- 迁移 userStats JSONB 到 sora2_user_stats
INSERT INTO sora2_user_stats (user_id, copy_count, vote_count, submit_count, first_visit, last_visit)
SELECT 
  key as user_id,
  (value->>'copyCount')::INTEGER as copy_count,
  (value->>'voteCount')::INTEGER as vote_count,
  (value->>'submitCount')::INTEGER as submit_count,
  (value->>'firstVisit')::TIMESTAMP WITH TIME ZONE as first_visit,
  (value->>'lastVisit')::TIMESTAMP WITH TIME ZONE as last_visit
FROM sora2_analytics,
     jsonb_each(user_stats) as t(key, value)
WHERE user_stats IS NOT NULL AND user_stats != '{}'::jsonb;
```

### 阶段 3: 代码适配
```typescript
// 修改 Sora2DataManager 使用新表结构
// 1. 用户统计操作改为 sora2_user_stats 表
// 2. 每日统计操作改为 sora2_daily_stats 表
// 3. 全局统计操作改为简化的 sora2_analytics 表
```

### 阶段 4: 清理旧数据
```sql
-- 删除旧的 JSONB 字段（可选，保留备份）
-- ALTER TABLE sora2_analytics DROP COLUMN user_stats;
-- ALTER TABLE sora2_analytics DROP COLUMN daily_stats;
```

## 🎯 实施建议

### 优先级
1. **高优先级**: 创建 `sora2_user_stats` 表，解决并发冲突
2. **中优先级**: 创建 `sora2_daily_stats` 表，优化查询性能
3. **低优先级**: 创建 `sora2_hourly_stats` 表，提供更细粒度分析

### 风险控制
1. **并行运行**: 新旧系统并行运行一段时间
2. **数据校验**: 迁移后对比数据一致性
3. **回滚计划**: 保留旧结构，随时可回滚
4. **监控**: 密切监控性能指标

### 性能监控
```sql
-- 监控查询性能
EXPLAIN ANALYZE SELECT * FROM sora2_user_stats WHERE user_id = 'xxx';

-- 监控表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE 'sora2_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 📈 预期收益

### 短期收益 (1-2周)
- ✅ 解决并发写入冲突
- ✅ 提升 API 响应速度
- ✅ 减少数据库锁定

### 中期收益 (1-2月)
- ✅ 支持更多并发用户
- ✅ 优化查询性能
- ✅ 提高系统稳定性

### 长期收益 (3-6月)
- ✅ 支持用户规模增长
- ✅ 提供更丰富的分析功能
- ✅ 为未来功能扩展奠定基础

## 🚀 下一步行动

1. **立即**: 创建优化的表结构 (`supabase-optimized-schema.sql`)
2. **本周**: 实现新的数据访问层
3. **下周**: 进行数据迁移和测试
4. **月底**: 完成全量切换和性能验证

这个优化方案将彻底解决当前的性能和扩展性问题，为系统的长期发展奠定坚实基础。
