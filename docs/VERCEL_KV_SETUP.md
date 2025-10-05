# Vercel KV 配置说明

## 问题说明
Vercel 是无状态环境，每次函数重启时内存数据会丢失。需要使用外部数据库来持久化存储数据。

## 解决方案：Vercel KV

### 1. 安装 Vercel KV
```bash
npm install @vercel/kv
```

### 2. 在 Vercel Dashboard 中配置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：

```
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
```

### 3. 创建 Vercel KV 数据库

1. 在 Vercel Dashboard 中，进入 **Storage** 选项卡
2. 点击 **Create Database**
3. 选择 **KV (Key-Value)**
4. 给数据库命名（例如：`sora-invite-codes`）
5. 选择地区（推荐选择离用户最近的地区）
6. 创建完成后，复制连接信息到环境变量

### 4. 部署更新

配置完成后，重新部署项目：
```bash
git add .
git commit -m "Add Vercel KV support for data persistence"
git push origin main
```

## 数据持久化说明

- **本地开发**：使用文件系统存储
- **Vercel 生产环境**：自动使用 Vercel KV 存储
- **数据同步**：所有数据操作都会自动同步到 KV 数据库

## 验证配置

部署后，检查 Vercel 函数日志，应该看到：
```
[DATA] Loaded X invite codes from Vercel KV
[DATA] Saved invite codes and analytics to Vercel KV
```

## 费用说明

Vercel KV 提供免费额度：
- 免费层：每月 30,000 次读取，1,000 次写入
- 对于邀请码应用，免费额度通常足够使用

## 备用方案

如果不想使用 Vercel KV，可以考虑：
1. **Supabase**：免费 PostgreSQL 数据库
2. **PlanetScale**：免费 MySQL 数据库
3. **MongoDB Atlas**：免费 MongoDB 数据库
