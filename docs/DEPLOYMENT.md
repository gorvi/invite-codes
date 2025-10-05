# 🚀 部署指南

本项目支持多种部署方式，推荐使用 Vercel 进行部署。

## 方式一：Vercel 部署（推荐）

### 1. 准备 GitHub 仓库

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: Sora2 Invite Code Platform"

# 创建主分支
git branch -M main

# 添加远程仓库（替换为你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/yourusername/sora2-invite-code.git

# 推送到 GitHub
git push -u origin main
```

### 2. 连接 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的 `sora2-invite-code` 仓库
5. 点击 "Deploy"

### 3. 自动部署

Vercel 会自动：
- 检测到 Next.js 项目
- 安装依赖
- 构建项目
- 部署到全球 CDN

### 4. 自定义域名（可选）

在 Vercel 项目设置中可以添加自定义域名。

## 方式二：GitHub Pages 部署

### 1. 启用 GitHub Actions

1. 在 GitHub 仓库页面，点击 "Settings"
2. 在左侧菜单找到 "Actions" > "General"
3. 确保 "Actions permissions" 设置为 "Allow all actions and reusable workflows"

### 2. 启用 GitHub Pages

1. 在仓库 Settings 页面，找到 "Pages"
2. 在 "Source" 选择 "GitHub Actions"
3. 保存设置

### 3. 推送代码触发部署

```bash
git push origin main
```

GitHub Actions 会自动构建并部署到 GitHub Pages。

### 4. 访问网站

部署完成后，网站地址为：
`https://yourusername.github.io/sora2-invite-code/`

## 方式三：Netlify 部署

### 1. 推送代码到 GitHub

```bash
git push origin main
```

### 2. 连接 Netlify

1. 访问 [netlify.com](https://netlify.com)
2. 用 GitHub 账号登录
3. 点击 "New site from Git"
4. 选择你的 GitHub 仓库
5. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `.next`
6. 点击 "Deploy site"

## 环境变量配置

### Vercel 环境变量

在 Vercel 项目设置中添加：

```
NODE_ENV=production
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
```

### GitHub Pages 环境变量

在 GitHub 仓库 Settings > Secrets 中添加：

```
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourusername.github.io/sora2-invite-code
```

## 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 选择部署平台（Vercel/Netlify/GitHub Pages）
- [ ] 配置环境变量
- [ ] 测试部署后的功能
- [ ] 配置自定义域名（可选）
- [ ] 设置自动部署

## 常见问题

### Q: 部署后页面显示 404？
A: 检查 basePath 配置是否正确，确保路径匹配。

### Q: API 路由不工作？
A: 确保部署平台支持 API 路由（Vercel 和 Netlify 都支持）。

### Q: 静态资源加载失败？
A: 检查 public 文件夹中的文件是否被正确复制。

## 性能优化建议

1. **启用 Vercel Analytics**
2. **使用 Vercel Edge Functions**（如果需要）
3. **配置 CDN 缓存**
4. **启用图片优化**

## 监控和维护

1. **设置部署通知**
2. **监控网站性能**
3. **定期更新依赖**
4. **备份数据**

---

选择最适合你需求的部署方式开始部署吧！🚀

