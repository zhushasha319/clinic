# Ping++ 微信支付集成说明

## 已完成的工作

### 1. 安装依赖

- ✅ 安装了 `pingpp` Node.js SDK

### 2. 数据库更新

- ✅ 在 Appointment 模型中添加了支付相关字段:
  - `paymentStatus`: 支付状态 (PENDING, PAID, FAILED)
  - `paymentOrderNo`: 订单号
  - `paymentChargeId`: Ping++ Charge ID
  - `paymentTransactionId`: 支付平台交易ID
  - `paymentCompletedAt`: 支付完成时间
- ✅ 运行了数据库迁移

### 3. API 路由

- ✅ `/api/payment/create`: 创建支付订单
- ✅ `/api/payment/webhook`: 接收支付回调通知

### 4. 前端组件

- ✅ `PaymentReviewCard`: 添加了支付按钮处理逻辑
  - 现金支付: 直接跳转到成功页面
  - 微信支付: 调用 API 创建订单并跳转到微信支付页面
- ✅ `/appointments/payment/success`: 支付成功页面

## 配置步骤

### 第 1 步: 注册 Ping++ 账号

1. 访问 https://www.pingxx.com/
2. 注册并登录控制台

### 第 2 步: 创建应用

1. 在 Ping++ 控制台创建新应用
2. 获取 `APP_ID` (应用ID)

### 第 3 步: 获取 API 密钥

1. 在控制台生成 API Key
2. 下载并保存私钥文件 (PEM 格式)
3. 获取公钥用于验证 Webhook 签名                 

### 第 4 步: 配置环境变量

在 `.env` 文件中添加以下配置:

```env
# Ping++ 配置
PINGPP_API_KEY=sk_live_your_api_key
PINGPP_APP_ID=app_your_app_id
PINGPP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your_private_key_content_here
-----END RSA PRIVATE KEY-----"
PINGPP_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
your_public_key_content_here
-----END PUBLIC KEY-----"

# 应用URL (用于支付回调)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**注意**: 私钥需要包含完整的 PEM 格式,包括头尾标记

### 第 5 步: 配置微信支付

1. 登录微信商户平台
2. 在 Ping++ 控制台关联微信商户号
3. 配置支付参数和授权

### 第 6 步: 配置 Webhook

1. 在 Ping++ 控制台配置 Webhook URL:
   ```
   https://your-domain.com/api/payment/webhook
   ```
2. 选择要接收的事件类型:
   - `charge.succeeded`: 支付成功
   - `charge.failed`: 支付失败

### 第 7 步: 测试支付流程

#### 测试环境

1. 使用 Ping++ 提供的测试 API Key
2. 使用测试模式的微信支付

#### 支付流程

1. 用户在支付页面选择"微信支付"
2. 勾选同意条款
3. 点击"微信支付"按钮
4. 系统调用 `/api/payment/create` 创建订单
5. 返回微信支付 URL
6. 跳转到微信支付页面
7. 用户完成支付
8. Ping++ 发送 Webhook 通知
9. 系统更新订单状态
10. 跳转到支付成功页面

## 支付渠道说明

### 微信支付渠道代码

- `wx`: 微信APP支付
- `wx_pub`: 微信公众号支付
- `wx_wap`: 微信H5支付
- `wx_lite`: 微信小程序支付

当前实现使用 `wx` 渠道,根据返回的 credential 类型自动选择:

- `wx_pub`: 公众号支付 URL
- `wx_wap`: H5 支付 URL

## 安全建议

1. **私钥安全**:
   - 不要将私钥提交到代码仓库
   - 使用环境变量存储
   - 定期轮换密钥

2. **Webhook 验证**:
   - 启用签名验证
   - 验证请求来源
   - 检查订单状态防止重复处理

3. **金额处理**:
   - 后端验证金额
   - 使用分为单位避免浮点误差
   - 记录完整的支付日志

## 调试技巧

1. **查看日志**:

   ```bash
   # 查看 API 请求日志
   console.log("创建支付订单:", chargeParams)

   # 查看 Webhook 日志
   console.log("收到 Webhook:", event)
   ```

2. **测试 Webhook**:
   - 使用 ngrok 暴露本地服务
   - 在 Ping++ 控制台测试 Webhook

3. **常见问题**:
   - 签名验证失败: 检查私钥格式
   - 支付跳转失败: 检查 credential 字段
   - Webhook 未收到: 检查 URL 配置和网络

## 生产环境部署

1. 切换到生产 API Key
2. 配置正式的微信商户号
3. 使用 HTTPS 域名
4. 配置生产环境 Webhook URL
5. 测试完整支付流程
6. 监控支付成功率和失败原因

## 相关文档

- Ping++ 官方文档: https://www.pingxx.com/docs
- 微信支付文档: https://pay.weixin.qq.com/wiki/doc/api/
- Node.js SDK: https://github.com/PingPlusPlus/pingpp-nodejs
