# 敏感词过滤系统

## 🎯 系统概述

为了保护 Sora 2 邀请码分享平台的用户体验，我们实现了一个完整的敏感词过滤系统，用于屏蔽用户提交的不合规邀请码。

## 🗄️ 数据库设计

### 敏感词表 (`sensitive_words`)

```sql
CREATE TABLE sensitive_words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL UNIQUE,
  word_type VARCHAR(50) DEFAULT 'general', -- 'general', 'spam', 'inappropriate', 'fake'
  severity_level INTEGER DEFAULT 1, -- 1-5, 5为最严重
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 索引优化
- `idx_sensitive_words_word`: 快速查找敏感词
- `idx_sensitive_words_type`: 按类型筛选
- `idx_sensitive_words_active`: 只查询活跃词汇
- `idx_sensitive_words_severity`: 按严重程度排序

## 📝 敏感词分类

### 1. 垃圾词汇 (spam)
- **test, test123, 123456**: 测试词汇
- **admin, user, guest**: 常见账户名
- **demo, sample, example**: 示例词汇
- **buy, sell, free, discount**: 商业推广词汇
- **aaaa, bbbb, 1111, 2222**: 重复字符组合

### 2. 虚假模式 (fake)
- **fake, invalid, expired**: 明确表示虚假
- **used, old, bad, wrong**: 表示无效状态
- **error**: 错误标识

### 3. 不当内容 (inappropriate)
- **spam**: 垃圾内容标识
- **scam, fraud, phishing**: 诈骗相关
- **virus, malware, hack, crack**: 恶意软件
- **steal, stealer, rat, botnet**: 恶意行为

### 4. 恶意模式 (severity_level: 5)
- **virus, trojan, worm**: 病毒类型
- **backdoor, keylog**: 后门程序
- **ddos**: 网络攻击

## 🔧 核心功能

### SensitiveWordValidator 类

```typescript
export class SensitiveWordValidator {
  // 初始化敏感词列表
  static async initialize(): Promise<void>
  
  // 验证邀请码
  static async validateInviteCode(inviteCode: string): Promise<{
    isValid: boolean
    reason?: string
    matchedWords?: string[]
  }>
  
  // 获取统计信息
  static async getStats(): Promise<{
    totalWords: number
    activeWords: number
    wordTypes: Record<string, number>
  }>
  
  // 添加新敏感词
  static async addSensitiveWord(word: string, wordType?: string, severityLevel?: number): Promise<boolean>
}
```

### 模式检测

系统会自动检测以下垃圾模式：

1. **重复字符模式**: `aaaa`, `1111`, `bbbb`
2. **连续数字模式**: `1234`, `5678`, `9876`
3. **过短内容**: 少于4位的纯数字或纯字母
4. **键盘模式**: `qwer`, `asdf`, `zxcv`

## 🛡️ 安全集成

### API 路由保护

#### 邀请码提交 API (`/api/invite-codes`)
```typescript
// 🔒 敏感词验证
const validation = await sensitiveWordValidator.validateInviteCode(code)
if (!validation.isValid) {
  return NextResponse.json({ 
    error: '邀请码包含不当内容，请提交有效的 Sora 2 邀请码',
    reason: validation.reason,
    matchedWords: validation.matchedWords
  }, { status: 400 })
}
```

#### 敏感词管理 API (`/api/sensitive-words`)
- `GET`: 获取敏感词统计信息
- `POST`: 添加新的敏感词
- `PUT`: 验证文本是否包含敏感词

### 错误响应示例

```json
{
  "error": "邀请码包含不当内容，请提交有效的 Sora 2 邀请码",
  "reason": "邀请码包含敏感词: test, fake",
  "matchedWords": ["test", "fake"]
}
```

## 🧪 测试功能

### 测试页面 (`/test-sensitive-words`)

提供完整的敏感词过滤测试界面：

- **手动测试**: 输入任意邀请码进行验证
- **快速测试**: 预设的测试用例
- **实时反馈**: 显示验证结果和匹配的敏感词
- **使用说明**: 详细的功能说明

### 测试用例

| 测试代码 | 预期结果 | 匹配词汇 |
|---------|----------|----------|
| `test123` | ❌ 拒绝 | test, test123 |
| `fake` | ❌ 拒绝 | fake |
| `invalid` | ❌ 拒绝 | invalid |
| `aaaa` | ❌ 拒绝 | 重复字符模式 |
| `123456` | ❌ 拒绝 | 123456 |
| `admin` | ❌ 拒绝 | admin |
| `MFW49D` | ✅ 通过 | 无 |
| `REALCODE` | ✅ 通过 | 无 |

## 📊 性能优化

### 缓存策略
- 敏感词列表在内存中缓存
- 避免重复数据库查询
- 支持动态更新敏感词列表

### 查询优化
- 使用索引加速敏感词查找
- 按严重程度排序，优先匹配高风险词汇
- 批量验证支持

## 🔄 维护功能

### 动态管理
- 支持运行时添加新敏感词
- 可以启用/禁用特定敏感词
- 按类型和严重程度分类管理

### 统计监控
```typescript
{
  totalWords: 67,      // 总敏感词数量
  activeWords: 67,     // 活跃敏感词数量
  wordTypes: {         // 按类型统计
    spam: 35,
    fake: 8,
    inappropriate: 24
  }
}
```

## 🚀 部署配置

### 环境变量
确保以下环境变量已配置：
- `SUPABASE_URL`: Supabase 项目 URL
- `SUPABASE_ANON_KEY`: Supabase 匿名密钥

### 数据库迁移
运行 `supabase-simplified-schema.sql` 脚本：
```bash
# 在 Supabase SQL 编辑器中执行
# 或使用 Supabase CLI
supabase db push
```

## 📈 使用统计

### 预期效果
- **垃圾内容过滤率**: 95%+ 
- **误报率**: < 1%
- **响应时间**: < 100ms
- **数据库负载**: 最小化（使用缓存）

### 监控指标
- 被拒绝的邀请码数量
- 敏感词匹配统计
- API 响应时间
- 错误日志分析

## 🔮 未来扩展

### 计划功能
1. **机器学习检测**: 使用 AI 模型识别新型垃圾内容
2. **用户举报**: 允许用户举报不当内容
3. **白名单机制**: 支持可信用户的快速通道
4. **多语言支持**: 扩展到中文等其他语言的敏感词
5. **实时更新**: 支持敏感词列表的热更新

### 集成建议
- 与用户行为分析系统集成
- 与内容审核工作流结合
- 支持第三方敏感词库导入

## 📚 相关文档

- [项目规则 - 内容过滤规则](.cursorrules#content-filtering-rules)
- [数据库优化方案](DATABASE_UPDATE_OPTIMIZATION.md)
- [开发指南](DEVELOPMENT.md)

---

**注意**: 敏感词过滤是保护用户体验的重要措施，请定期更新敏感词库以应对新的垃圾内容模式。
