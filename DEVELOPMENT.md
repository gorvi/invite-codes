# Sora 2 Invite Codes - 开发指南

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

## 📁 项目结构

```
sora2-invite-code/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── faq/               # FAQ 页面
│   ├── how-it-works/      # 使用指南页面
│   └── page.tsx           # 主页
├── components/            # React 组件
├── lib/                   # 工具函数和数据处理
├── public/                # 静态资源
└── middleware.ts          # Next.js 中间件
```

## 🛠️ 开发规范

### 命名规范
- **常量**: `UPPER_CASE_WITH_UNDERSCORES`
- **函数**: `camelCase`
- **组件**: `PascalCase`
- **文件**: `kebab-case` (页面) / `PascalCase` (组件)

### 代码风格
- 使用 TypeScript 严格模式
- 优先使用函数组件和 Hooks
- 使用 Tailwind CSS 进行样式设计
- 所有 API 路由都要有错误处理

### 数据管理
- 所有数据操作通过 `lib/data.ts` 进行
- 生产环境使用 Vercel KV (Upstash Redis)
- 开发环境使用本地文件存储

### 数据库更新优化原则 ⚡
**核心规则：只更新相关的用户或记录，避免批量更新所有数据**

#### 更新策略
- ✅ **精确更新**: 只更新发生变化的特定用户记录
- ✅ **单用户操作**: 用户操作只影响自己的统计数据
- ✅ **增量更新**: 使用 `upsert` 只更新必要的字段
- ❌ **避免批量更新**: 不要因为单个用户操作而更新所有用户数据
- ❌ **避免全局刷新**: 不要重置或重新计算整个数据集

#### 具体实现
```typescript
// ✅ 正确：只更新特定用户
await supabase
  .from('sora2_user_stats')
  .upsert({
    user_id: userId,
    copy_count: newCopyCount,
    updated_at: getBeijingTimeISOString()
  }, { onConflict: 'user_id' })

// ❌ 错误：批量更新所有用户
await supabase
  .from('sora2_user_stats')
  .upsert(allUserStats) // 包含所有用户数据
```

#### 性能影响
- **优化前**: 每次操作更新所有用户 → 高数据库负载
- **优化后**: 每次操作只更新相关用户 → 低数据库负载，更好的并发性能

## 🔧 环境配置

### 开发环境
```bash
# 不需要额外配置，使用本地文件存储
npm run dev
```

### 生产环境
需要配置以下环境变量：
```bash
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_token
VERCEL_ENV=production
```

## 🎮 游戏功能

### 分数系统
- **Global Best**: 全球最高分，只有更高分数才能覆盖
- **Your Best**: 个人最高分，只有更高分数才能覆盖
- 所有分数都持久化到生产数据库

### API 端点
- `POST /api/game-stats` - 提交游戏分数
- `GET /api/game-stats` - 获取游戏统计

## 📊 数据持久化

### 存储适配器
- **生产环境**: Vercel KV (Upstash Redis)
- **开发环境**: 本地文件存储

### 数据结构
```typescript
// 游戏统计
gameStats: {
  globalBestScore: number
  totalGamesPlayed: number
  totalHamstersWhacked: number
}

// 用户统计
userStats: {
  [userId]: {
    personalBestScore: number
    copyCount: number
    voteCount: number
    // ...
  }
}
```

## 🔒 安全措施

### 已实施的保护
- 中间件保护（阻止恶意爬虫）
- 版权保护（防止拖拽保存 logo）
- Robots.txt 配置
- 安全头部设置

### 安全原则
- 不暴露敏感信息
- 验证所有用户输入
- 使用环境变量存储配置
- 实施适当的错误处理

## 🚀 部署

### Vercel 部署
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

### 环境变量配置
在 Vercel 项目设置中配置：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## 🐛 调试

### 本地调试
```bash
# 查看环境信息
http://localhost:3000/debug-env

# 查看本地数据
http://localhost:3000/local-env
```

### 生产调试
- 查看 Vercel 函数日志
- 检查 Upstash Redis 控制台
- 使用浏览器开发者工具

## 📝 提交规范

### 提交信息格式
```
feat: 添加新功能
fix: 修复问题
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建过程或辅助工具的变动
```

### 分支管理
- `main`: 生产分支
- `dev`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支

## 🔍 常见问题

### 数据不一致
- 检查环境变量配置
- 确认数据库连接正常
- 查看服务器日志

### 游戏分数问题
- 确认 userId 参数正确传递
- 检查分数更新逻辑
- 验证数据持久化

### 部署问题
- 检查环境变量是否设置
- 确认数据库连接配置
- 查看 Vercel 构建日志

## 📚 相关资源

- [Next.js 文档](https://nextjs.org/docs)
- [Vercel KV 文档](https://vercel.com/docs/storage/vercel-kv)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
