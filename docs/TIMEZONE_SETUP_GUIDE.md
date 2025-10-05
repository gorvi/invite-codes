# 北京时间设置指南

## 🕐 概述

本项目已配置为使用北京时间（UTC+8）作为数据库和应用程序的标准时区。

## 📁 相关文件

### 1. 数据库时区设置
- **文件**: `supabase-timezone-beijing.sql`
- **作用**: 设置 Supabase 数据库时区为北京时间
- **使用方法**: 在 Supabase SQL Editor 中执行此脚本

### 2. 时间工具函数
- **文件**: `lib/timeUtils.ts`
- **作用**: 提供北京时间相关的工具函数
- **主要函数**:
  - `getBeijingTime()` - 获取当前北京时间
  - `getBeijingTimeISOString()` - 获取北京时间的 ISO 字符串
  - `createInviteCodeTimestamp()` - 创建邀请码时的时间戳
  - `getTodayBeijingDateString()` - 获取今天北京日期字符串

### 3. 修改的文件
- `lib/data.ts` - 使用北京时间创建邀请码
- `lib/sora2DataManager.ts` - 用户统计数据使用北京时间
- `lib/gameDataManager.ts` - 游戏分数使用北京时间

## 🚀 设置步骤

### 步骤 1: 设置数据库时区

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行 `supabase-timezone-beijing.sql` 脚本
4. 验证时区设置：
   ```sql
   SELECT current_setting('timezone') as current_timezone;
   SELECT NOW() AT TIME ZONE 'Asia/Shanghai' as beijing_time;
   ```

### 步骤 2: 验证应用程序

1. 重启开发服务器
2. 提交一个新的邀请码
3. 检查数据库中的 `created_at` 字段是否为北京时间

## 🔍 验证方法

### 数据库验证
```sql
-- 检查当前时区设置
SELECT current_setting('timezone');

-- 查看最新的邀请码时间
SELECT id, code, created_at, created_at AT TIME ZONE 'Asia/Shanghai' as beijing_time
FROM sora2_invite_codes 
ORDER BY created_at DESC 
LIMIT 5;

-- 查看游戏分数时间
SELECT id, user_id, score, created_at, created_at AT TIME ZONE 'Asia/Shanghai' as beijing_time
FROM game_scores 
ORDER BY created_at DESC 
LIMIT 5;
```

### 应用程序验证
1. 查看浏览器控制台日志
2. 检查邀请码列表中的时间显示
3. 验证游戏分数的记录时间

## 📊 时区转换说明

### JavaScript 时间处理
- 所有 `new Date()` 调用已替换为 `getBeijingTime()`
- 所有 `toISOString()` 调用已替换为 `getBeijingTimeISOString()`
- 数据库插入时自动使用北京时间

### PostgreSQL 时间处理
- 使用 `TIMESTAMP WITH TIME ZONE` 字段类型
- 默认值使用 `NOW()` 函数（自动使用数据库时区）
- 查询时可以使用 `AT TIME ZONE 'Asia/Shanghai'` 进行时区转换

## ⚠️ 注意事项

1. **数据一致性**: 现有数据的时间戳不会自动转换，只有新数据会使用北京时间
2. **客户端显示**: 前端显示的时间可能需要额外的时区转换处理
3. **API 响应**: API 返回的时间戳仍然是 ISO 格式，需要前端进行本地化处理

## 🛠️ 故障排除

### 问题 1: 时区设置不生效
**解决方案**: 重新执行 `supabase-timezone-beijing.sql` 脚本

### 问题 2: 时间显示不正确
**解决方案**: 检查浏览器控制台是否有错误，确认 `timeUtils.ts` 正确导入

### 问题 3: 数据库时间仍然是 UTC
**解决方案**: 检查 Supabase 项目的时区设置，确认执行了时区设置脚本

## 📈 性能影响

- **最小影响**: 时区转换对性能影响很小
- **缓存优化**: 时间工具函数使用了高效的 Date 对象操作
- **数据库优化**: 添加了北京时间的索引以优化查询性能

## 🔄 回滚方案

如果需要回滚到 UTC 时间：

1. 修改数据库时区设置：
   ```sql
   SET timezone = 'UTC';
   ```

2. 恢复代码中的时间处理：
   - 将 `getBeijingTime()` 替换为 `new Date()`
   - 将 `getBeijingTimeISOString()` 替换为 `new Date().toISOString()`

3. 重新部署应用程序

## 📝 更新日志

- **2025-01-04**: 初始实现北京时间支持
- **2025-01-04**: 添加时间工具函数和数据库时区设置
- **2025-01-04**: 修改所有数据管理器使用北京时间
