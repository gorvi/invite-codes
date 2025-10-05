# Git 分支管理策略

## 🎯 推荐的分支结构

### 核心分支
```
main (生产环境)
├── 部署到生产环境
├── 使用 prod: 数据前缀
└── 只接受来自 dev 分支的合并

dev (测试环境)  
├── 部署到测试环境
├── 使用 dev: 数据前缀
└── 集成所有功能分支

feature/* (功能分支)
├── 从 dev 分支创建
├── 开发完成后合并回 dev
└── 使用 dev: 数据前缀
```

## 🔧 分支管理操作

### 1. 创建新分支

#### 在 GitHub 网页上：
1. 点击右上角的 **"New branch"** 按钮
2. 输入分支名称：`dev` 或 `feature/功能名称`
3. 选择基于哪个分支创建（通常是 `main`）
4. 点击 **"Create branch"**

#### 在本地命令行：
```bash
# 创建并切换到新分支
git checkout -b dev

# 或者创建功能分支
git checkout -b feature/new-feature

# 推送到远程仓库
git push -u origin dev
```

### 2. 分支命名规范

```
main          - 生产环境分支
dev           - 测试环境分支  
feature/*     - 功能开发分支
hotfix/*      - 紧急修复分支
release/*     - 发布准备分支
```

### 3. 清理现有分支

#### 删除不需要的分支

**在 GitHub 网页上：**
1. 进入 **Branches** 页面
2. 找到要删除的分支
3. 点击分支右侧的 **🗑️ 垃圾桶图标**
4. 确认删除

**在本地命令行：**
```bash
# 删除本地分支
git branch -d release_0.0.1

# 删除远程分支
git push origin --delete release_0.0.1
```

### 4. 分支合并流程

```
feature/new-feature → dev → main
```

#### 合并到 dev 分支：
```bash
# 切换到 dev 分支
git checkout dev

# 拉取最新代码
git pull origin dev

# 合并功能分支
git merge feature/new-feature

# 推送到远程
git push origin dev
```

#### 合并到 main 分支：
```bash
# 切换到 main 分支
git checkout main

# 拉取最新代码
git pull origin main

# 合并 dev 分支
git merge dev

# 推送到远程
git push origin main
```

## 🚀 部署配置

### Vercel 自动部署配置

```
分支映射：
├── main → 生产环境 (prod: 前缀)
├── dev → 测试环境 (dev: 前缀)
└── feature/* → 预览环境 (dev: 前缀)
```

### 环境变量配置

#### 在 Vercel Dashboard 设置：

**Production (main 分支):**
```bash
VERCEL_ENV=production
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
```

**Preview (dev 和 feature 分支):**
```bash
VERCEL_ENV=preview  
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token
```

## 📋 具体操作步骤

### 步骤 1: 创建 dev 分支

```bash
# 在本地创建 dev 分支
git checkout main
git pull origin main
git checkout -b dev
git push -u origin dev
```

### 步骤 2: 清理 release 分支

```bash
# 删除本地的 release_0.0.1 分支
git branch -d release_0.0.1

# 删除远程的 release_0.0.1 分支
git push origin --delete release_0.0.1
```

### 步骤 3: 配置 Vercel 部署

1. 进入 Vercel Dashboard
2. 选择你的项目
3. 进入 **Settings** → **Git**
4. 配置分支部署：
   - **Production Branch**: `main`
   - **Preview Branches**: `dev`, `feature/*`

### 步骤 4: 设置环境变量

在 Vercel 项目中为不同环境设置对应的环境变量。

## 🔄 开发工作流

### 日常开发流程：

1. **创建功能分支**：
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/add-new-feature
   ```

2. **开发功能**：
   ```bash
   # 开发代码...
   git add .
   git commit -m "feat: add new feature"
   ```

3. **推送到远程**：
   ```bash
   git push -u origin feature/add-new-feature
   ```

4. **创建 Pull Request**：
   - 从 `feature/add-new-feature` → `dev`
   - 代码审查
   - 合并到 dev 分支

5. **部署到生产**：
   - 从 `dev` → `main`
   - 自动部署到生产环境

## 📊 分支状态检查

### 查看分支状态：
```bash
# 查看所有分支
git branch -a

# 查看分支详细信息
git branch -vv

# 查看分支历史
git log --oneline --graph --all
```

### 同步分支：
```bash
# 更新所有分支信息
git fetch --all

# 同步特定分支
git checkout main
git pull origin main
```

## 💡 最佳实践

1. **保持分支整洁**：定期删除不需要的分支
2. **使用描述性命名**：分支名称要清楚表达用途
3. **及时合并**：功能完成后及时合并，避免冲突
4. **代码审查**：使用 Pull Request 进行代码审查
5. **环境隔离**：不同分支对应不同环境
