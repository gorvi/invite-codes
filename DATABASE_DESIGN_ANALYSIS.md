# 数据库设计分析：实时查询 vs 预聚合存储

## 🤔 问题：sora2_analytics 表是否必要？

### 方案对比

#### 方案A: 实时查询各个表 (用户建议)
```sql
-- 实时计算全局统计
SELECT 
  (SELECT COUNT(*) FROM sora2_invite_codes WHERE status = 'active') as active_count,
  (SELECT COUNT(*) FROM sora2_invite_codes) as total_count,
  (SELECT COUNT(*) FROM sora2_user_stats) as total_users,
  (SELECT SUM(copy_count) FROM sora2_user_stats) as total_copies,
  (SELECT SUM(vote_count) FROM sora2_user_stats) as total_votes,
  (SELECT COUNT(*) FROM sora2_daily_stats WHERE date = CURRENT_DATE) as today_stats;
```

#### 方案B: 预聚合存储 (当前方案)
```sql
-- 直接从聚合表读取
SELECT * FROM sora2_analytics WHERE id = 1;
```

## 📊 性能对比分析

### 数据规模假设
- **邀请码**: 10,000 条记录
- **用户统计**: 50,000 个用户
- **每日统计**: 365 天历史数据
- **每小时统计**: 8,760 小时历史数据

### 查询性能对比

| 指标 | 实时查询 (方案A) | 预聚合存储 (方案B) | 性能差异 |
|------|------------------|-------------------|----------|
| **查询时间** | 50-200ms | 1-5ms | **10-40x 更快** |
| **CPU 使用** | 高 (需要扫描多表) | 低 (单行读取) | **显著降低** |
| **内存使用** | 高 (临时结果集) | 低 (单行数据) | **显著降低** |
| **并发支持** | 差 (多表锁竞争) | 好 (单行锁) | **显著提升** |

### 详细分析

#### 实时查询的问题
```sql
-- 这个查询需要：
-- 1. 扫描 sora2_invite_codes 表 (10,000 行)
-- 2. 扫描 sora2_user_stats 表 (50,000 行)  
-- 3. 扫描 sora2_daily_stats 表 (365 行)
-- 4. 执行多个聚合计算
-- 5. 返回结果
SELECT 
  (SELECT COUNT(*) FROM sora2_invite_codes WHERE status = 'active') as active_count,
  (SELECT COUNT(*) FROM sora2_invite_codes) as total_count,
  (SELECT COUNT(*) FROM sora2_user_stats) as total_users,
  (SELECT SUM(copy_count) FROM sora2_user_stats) as total_copies;
```

**问题**:
- ❌ 每次查询都要扫描大量数据
- ❌ 多个子查询无法并行执行
- ❌ 随着数据增长，查询时间线性增长
- ❌ 高并发时数据库压力大

#### 预聚合存储的优势
```sql
-- 这个查询只需要：
-- 1. 读取单行数据 (sora2_analytics.id = 1)
-- 2. 返回结果
SELECT * FROM sora2_analytics WHERE id = 1;
```

**优势**:
- ✅ 查询时间恒定，不随数据增长而变化
- ✅ 单行读取，极低的内存和 CPU 使用
- ✅ 支持高并发访问
- ✅ 可以添加缓存层进一步优化

## 🔄 数据一致性分析

### 方案A: 实时查询
**优势**:
- ✅ 数据始终是最新的
- ✅ 无需维护聚合逻辑
- ✅ 简化写入流程

**劣势**:
- ❌ 查询性能随数据增长而下降
- ❌ 高并发时数据库压力大
- ❌ 复杂查询难以优化

### 方案B: 预聚合存储
**优势**:
- ✅ 查询性能优秀且稳定
- ✅ 支持高并发访问
- ✅ 可以添加缓存层

**劣势**:
- ❌ 需要维护聚合逻辑
- ❌ 可能存在短暂的数据不一致
- ❌ 写入时需要更新聚合表

## 💡 混合方案建议

考虑到你的关注点，我建议采用**混合方案**：

### 核心思想
- **高频查询**: 使用预聚合存储
- **精确查询**: 使用实时计算
- **数据同步**: 异步更新聚合数据

### 具体实现

#### 1. 保留 sora2_analytics 表用于高频查询
```sql
-- 用于首页展示、API 响应等高频场景
SELECT * FROM sora2_analytics WHERE id = 1;
```

#### 2. 提供实时查询接口用于精确场景
```sql
-- 用于管理后台、数据分析等需要精确数据的场景
CREATE OR REPLACE FUNCTION get_real_time_stats()
RETURNS TABLE (
  active_count BIGINT,
  total_count BIGINT,
  total_users BIGINT,
  total_copies BIGINT,
  total_votes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM sora2_invite_codes WHERE status = 'active'),
    (SELECT COUNT(*) FROM sora2_invite_codes),
    (SELECT COUNT(*) FROM sora2_user_stats),
    (SELECT COALESCE(SUM(copy_count), 0) FROM sora2_user_stats),
    (SELECT COALESCE(SUM(vote_count), 0) FROM sora2_user_stats);
END;
$$ LANGUAGE plpgsql;
```

#### 3. 异步更新聚合数据
```sql
-- 使用数据库触发器或应用层逻辑
-- 在数据变更时异步更新 sora2_analytics
CREATE OR REPLACE FUNCTION update_analytics_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 异步更新聚合数据
  PERFORM pg_notify('update_analytics', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 在关键表上添加触发器
CREATE TRIGGER trigger_update_analytics_invite_codes
  AFTER INSERT OR UPDATE OR DELETE ON sora2_invite_codes
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_analytics_on_change();
```

## 🎯 推荐方案

### 对于你的项目，我推荐：

#### **阶段1: 简化方案** (立即可用)
```sql
-- 删除 sora2_analytics 表
DROP TABLE IF EXISTS sora2_analytics CASCADE;

-- 使用实时查询
CREATE OR REPLACE VIEW sora2_stats AS
SELECT 
  (SELECT COUNT(*) FROM sora2_invite_codes WHERE status = 'active') as active_count,
  (SELECT COUNT(*) FROM sora2_invite_codes) as total_count,
  (SELECT COUNT(*) FROM sora2_user_stats) as total_users,
  (SELECT COALESCE(SUM(copy_count), 0) FROM sora2_user_stats) as total_copies,
  (SELECT COALESCE(SUM(vote_count), 0) FROM sora2_user_stats) as total_votes,
  (SELECT COALESCE(SUM(submit_count), 0) FROM sora2_daily_stats WHERE date = CURRENT_DATE) as today_submits;
```

**优势**:
- ✅ 数据始终准确
- ✅ 简化架构
- ✅ 减少维护成本
- ✅ 适合中小规模数据

#### **阶段2: 优化方案** (数据量大时)
当数据量增长到影响性能时，再考虑添加预聚合存储。

## 📈 性能测试建议

### 测试场景
```sql
-- 测试实时查询性能
EXPLAIN ANALYZE SELECT * FROM sora2_stats;

-- 测试不同数据规模下的性能
-- 1,000 条记录
-- 10,000 条记录  
-- 100,000 条记录
```

### 性能阈值
- **< 50ms**: 可以接受，使用实时查询
- **50-200ms**: 考虑优化，添加缓存
- **> 200ms**: 必须优化，使用预聚合

## 🚀 结论

你的建议很有道理！对于中小规模的应用，**实时查询确实更简单、更可靠**。

我建议：
1. **立即采用**: 删除 `sora2_analytics` 表，使用实时查询
2. **监控性能**: 随着数据增长监控查询性能
3. **适时优化**: 当性能成为瓶颈时，再考虑预聚合存储

这样既保持了数据的一致性，又简化了架构，是一个很好的平衡！
