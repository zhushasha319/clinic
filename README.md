# Clinic App

现代化诊所管理与预约系统，支持患者在线预约、医生管理、后台运营与支付等流程。项目基于 Next.js App Router 与 Prisma，适合快速搭建一套可扩展的门诊预约平台。

## 功能概览

- 在线预约：选择医生与时间段完成挂号
- 医生管理：档案、请假与可预约时间管理
- 后台管理：医生/科室/预约管理与数据看板
- 支付与订单：现金支付与 Ping++ 支付宝支付回调
- 评价系统：就诊完成后提交评价与评分
- 国际化与主题：多语言与主题切换
- 上传：图片/头像上传（UploadThing）

## 技术栈

- Next.js 16（App Router）
- React 19 + TypeScript
- Prisma + PostgreSQL（含 Neon 适配）
- Auth.js / NextAuth（Auth v5）
- Tailwind CSS + Radix UI
- UploadThing、Ping++、Recharts

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 配置环境变量（见下文）

3. 初始化数据库并生成客户端

```bash
npx prisma migrate dev
```

4. （可选）填充演示数据

```bash
npx prisma db seed
```

5. 启动开发环境

```bash
npm run dev
```

## 环境变量

请在项目根目录创建 `.env`，必要时参考 `.env.pingpp.example`，建议仅在本地/部署环境使用，勿提交到仓库。

| 变量 | 说明 |
| --- | --- |
| DATABASE_URL | PostgreSQL 连接字符串 |
| APP_TIMEZONE | 应用时区（默认 `Asia/Shanghai`） |
| NEXT_PUBLIC_APP_NAME | 站点名称（可选） |
| NEXT_PUBLIC_APP_URL | 应用公开 URL（支付回调/跳转用） |
| AUTH_SECRET | Auth.js 密钥 |
| AUTH_URL | 认证回调基准 URL（本地可为 `http://localhost:3000`） |
| AUTH_TRUST_HOST | 本地开发可设为 `true` |
| UPLOADTHING_TOKEN | UploadThing Token |
| UPLOADTHING_SECRET | UploadThing Secret |
| UPLOADTHING_APP_ID | UploadThing App ID |
| PINGPP_API_KEY | Ping++ API Key |
| PINGPP_APP_ID | Ping++ App ID |
| PINGPP_PRIVATE_KEY | Ping++ 私钥（PEM 完整内容） |
| PINGPP_PUBLIC_KEY | Ping++ 公钥（用于验签） |

## 数据库与种子数据

本项目使用 Prisma 管理数据库模型与迁移。

- 初始化/迁移：`npx prisma migrate dev`
- 生成 Prisma Client：迁移过程中自动完成
- 填充种子数据：`npx prisma db seed`

种子数据会创建示例账号（仅用于本地测试）：

- 管理员：`admin@test.com` / `123`
- 患者：`patient@test.com` / `123`

## 支付接入（Ping++）

- 创建订单：`/api/payment/create`
- 支付回调：`/api/payment/webhook`
- 详细步骤请查看：`docs/PAYMENT_INTEGRATION.md`

## 目录结构

- `app/`：页面与 API 路由（含 admin/auth/root 分组）
- `components/`：通用组件
- `lib/`：服务端 actions、配置与工具
- `hooks/`：前端 hooks
- `prisma/`：数据库模型、迁移与种子
- `messages/`：多语言文案
- `docs/`：项目文档

## 常用脚本

```bash
npm run dev     # 启动开发环境
npm run build   # 构建生产包
npm run start   # 启动生产服务
npm run lint    # 代码检查
```
