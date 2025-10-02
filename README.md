# Sora2 Invite Code Platform

一个仿造 formbiz.biz 的 Sora 邀请码分享平台，帮助用户获取和分享 Sora 的访问权限。

## 功能特性

### 核心功能
- 🔗 **邀请码展示系统** - 实时显示可用的 Sora 邀请码
- 📝 **邀请码提交功能** - 用户可以提交自己的邀请码
- 🔄 **实时更新** - 使用 SSE (Server-Sent Events) 实时推送新邀请码
- 👍 **社区反馈机制** - 用户可以对邀请码有效性进行投票
- ❓ **FAQ 系统** - 可折叠的常见问题解答
- 🎮 **打地鼠小游戏** - 增加用户互动和娱乐性
- ☕ **创作者支持** - 集成 Buy Me A Coffee 捐赠功能
- 📊 **数据统计系统** - 记录用户行为（复制、投票、提交）
- 🔍 **管理员面板** - 查看详细的统计数据和邀请码表现
- 🗑️ **智能清除机制** - 自动清除无效的邀请码

### 技术栈
- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **实时通信**: Server-Sent Events (SSE)
- **部署**: Vercel (推荐)

### 智能状态管理机制
系统会根据投票情况自动管理邀请码状态：

#### 🔄 **自动标记为"已用完"**
- 当独立用户有效投票数 ≥ 4 时
- 说明邀请码已达到 Sora2 的4人邀请限制

#### ❌ **自动标记为"无效"**
- 独立用户无效投票数 > 独立用户有效投票数
- 且至少有2个独立用户验证过
- 确保只有经过充分验证的无效邀请码才会被清除
- 防止同一用户多次投票影响删除判断

#### 🛡️ **保护机制**
- 需要至少2个独立用户验证才能标记为无效
- 同一用户多次投票只计算一次，防止刷票
- 使用独立用户投票数而非总投票数进行判断
- 避免恶意投票导致有效邀请码被误删
- 符合 Sora2 邀请码的实际使用限制

## 项目结构

```
sora2-invite-code/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── submit/            # 提交页面
│   │   └── page.tsx
│   ├── admin/             # 管理员面板
│   │   └── page.tsx
│   └── api/               # API 路由
│       ├── invite-codes/  # 邀请码管理
│       ├── analytics/     # 统计数据
│       └── sse/           # 实时更新
├── lib/                    # 共享工具和数据
│   └── data.ts            # 模拟数据存储
├── components/            # React 组件
│   ├── Header.tsx         # 头部导航
│   ├── CreatorNote.tsx    # 创作者说明
│   ├── InviteCodeDisplay.tsx # 邀请码展示
│   ├── SupportCreator.tsx # 支持创作者
│   ├── WhackHamsterGame.tsx # 打地鼠游戏
│   ├── FAQ.tsx           # 常见问题
│   ├── HowItWorks.tsx    # 使用说明
│   ├── CommunityImpact.tsx # 社区影响
│   └── Footer.tsx        # 页脚
├── public/               # 静态资源
├── package.json          # 项目配置
├── tailwind.config.js    # Tailwind 配置
├── tsconfig.json         # TypeScript 配置
└── README.md            # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 4. 查看统计数据

访问 [http://localhost:3000/admin](http://localhost:3000/admin) 查看管理员面板，包括：
- 📊 总体统计（总点击量、复制次数、投票数据）
- 📅 每日统计
- 🔍 单个邀请码的详细表现
- 📈 成功率分析

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 开发计划

### 已完成 ✅
- [x] 项目基础结构搭建
- [x] 前端界面实现
- [x] 邀请码展示组件
- [x] 提交表单页面
- [x] FAQ 折叠组件
- [x] 打地鼠小游戏
- [x] 响应式设计
- [x] 后端 API 开发
- [x] 实时更新功能 (SSE)
- [x] 投票系统
- [x] 数据统计系统
- [x] 管理员面板

### 待开发 📋
- [ ] 数据库集成（持久化存储）
- [ ] 用户认证系统
- [ ] 邀请码验证逻辑
- [ ] 邮件通知
- [ ] 移动端优化
- [ ] 数据导出功能

## 部署

### Vercel 部署 (推荐)

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 自动部署完成

### 其他平台

项目基于 Next.js，可以部署到任何支持 Node.js 的平台：
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 环境变量

创建 `.env.local` 文件：

```env
# 数据库配置
DATABASE_URL=your_database_url

# 认证配置
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# API 配置
API_BASE_URL=http://localhost:3000/api
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- 感谢 [formbiz.biz](https://formbiz.biz/) 提供的设计灵感
- 感谢 OpenAI 开发的 Sora
- 感谢所有为社区贡献邀请码的用户

