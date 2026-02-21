# AI 医疗助手功能方案

## 一、功能概述

用户在首页点击「AI 医疗助手」按钮，弹出对话框（Dialog），输入自己的症状描述（如"我咳嗽三天、发烧38.5、喉咙痛"），AI 分析后返回：

1. **可能科室推荐**（如：呼吸内科 / 发热门诊）
2. **风险提示**（如：出现呼吸困难/持续高热建议立即就医）
3. **下一步建议**（建议做什么检查、怎么跟医生描述病情）
4. **一键选择科室按钮** → 点击后跳转到对应科室的医生列表，进入预约流程

---

## 二、技术方案

### 2.1 整体架构

```
用户输入症状
    ↓
前端 Dialog 组件 (AIMedicalAssistant)
    ↓
POST /api/ai/consultation  (Next.js API Route)
    ↓
调用阿里通义千问 API（DashScope）
    ↓
返回结构化 JSON
    ↓
前端渲染推荐结果 + 科室按钮
    ↓
用户点击"选择科室" → 跳转到首页科室弹窗（显示该科室医生列表）
```

### 2.2 AI 模型选择

使用 阿里通义千问

### 2.3 需要新增的文件

| 文件路径                                          | 说明                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `app/api/ai/consultation/route.ts`                | API 路由：接收症状、调用 AI、返回结构化结果                |
| `components/organisms/ai-medical-assistant.tsx`   | 主组件：Dialog + 输入框 + 结果展示 + 科室按钮              |
| `components/molecules/ai-consultation-result.tsx` | 子组件：渲染 AI 分析结果（科室推荐、风险提示、下一步建议） |

### 2.4 需要修改的文件

| 文件路径              | 修改内容                                 |
| --------------------- | ---------------------------------------- |
| `app/(root)/page.tsx` | 在首页添加 `<AIMedicalAssistant />` 组件 |
| `messages/zh.json`    | 新增 `aiAssistant` 命名空间的中文文案    |
| `messages/en.json`    | 新增 `aiAssistant` 命名空间的英文文案    |
| `package.json`        | 新增依赖 `openai`（通义千问兼容该 SDK）  |
| `.env`                | 新增环境变量 `DASHSCOPE_API_KEY`         |

---

## 三、详细设计

### 3.1 API 路由设计 — `app/api/ai/consultation/route.ts`

**请求：**

```json
POST /api/ai/consultation
{
  "symptoms": "我咳嗽三天、发烧38.5、喉咙痛"
}
```

**AI Prompt 设计（System Prompt）：**

```
你是一个专业的医疗分导助手。用户会告诉你他们的症状，你需要：

1. 分析症状，推荐 1-3 个最可能的科室（只能从以下科室中选择）：
   - 心内科（dept-cardiology）
   - 神经内科（dept-neurology）
   - 儿科（dept-pediatrics）
   - 骨科（dept-orthopedics）
   - 皮肤科（dept-dermatology）
   - 眼科（dept-ophthalmology）
   如果以上科室都不匹配，回复"建议到综合门诊就诊"。

2. 给出风险提示：什么情况下需要立即就医。

3. 给出下一步建议：建议做什么检查、怎么跟医生描述病情。

请严格按照以下 JSON 格式返回（不要返回其他内容）：
{
  "departments": [
    { "id": "科室ID", "name": "科室名称", "confidence": "高/中/低", "reason": "推荐原因" }
  ],
  "riskWarnings": ["风险提示1", "风险提示2"],
  "nextSteps": {
    "suggestedTests": ["建议检查1", "建议检查2"],
    "howToDescribe": "跟医生描述病情的建议",
    "generalAdvice": "一般性建议"
  },
  "summary": "一句话总结"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "departments": [
      { "id": "dept-cardiology", "name": "心内科", "confidence": "高", "reason": "..." }
    ],
    "riskWarnings": ["..."],
    "nextSteps": { ... },
    "summary": "..."
  }
}
```

### 3.2 前端组件设计

#### 3.2.1 `AIMedicalAssistant`（主组件）

**位置：**右下角悬浮按钮

**UI 流程：**

```
[初始状态]
  └─ 悬浮按钮（🤖 AI 医疗助手）
       ↓ 点击
[Dialog 打开]
  ├─ 标题："AI 智能导诊"
  ├─ 输入区：Textarea（"请描述您的症状..."）
  ├─ 发送按钮
  └─ 免责声明："本功能仅供参考，不构成医疗诊断建议"
       ↓ 提交后
[加载状态]
  └─ Loading 动画 + "AI 正在分析您的症状..."
       ↓ 返回结果
[结果展示]
  ├─ 📋 总结（summary）
  ├─ 🏥 推荐科室列表
  │    └─ 每个科室一个按钮卡片，显示名称 + 匹配度 + 推荐原因
  │         └─ 点击 → 关闭 Dialog → 滚动到科室区域 → 触发该科室弹窗（复用现有 DepartmentsSection 逻辑）
  ├─ ⚠️ 风险提示（红色警告框）
  ├─ 📝 下一步建议
  │    ├─ 建议检查项目
  │    ├─ 怎么跟医生说
  │    └─ 一般建议
  └─ 🔄 重新咨询按钮
```

#### 3.2.2 科室跳转逻辑

由于现有的 `DepartmentsSectionClient` 组件已有科室点击弹窗逻辑，我们有两种方案：

**方案 A（推荐）：URL 参数触发**

- 点击推荐科室按钮 → 关闭 AI Dialog → 页面滚动到 `#our-departments` → URL 添加 `?dept=dept-cardiology`
- `DepartmentsSectionClient` 读取 URL 参数，自动打开对应科室的医生列表 Dialog

### 3.3 国际化文案

**`messages/zh.json` 新增：**

```json
{
  "aiAssistant": {
    "title": "AI 智能导诊",
    "buttonLabel": "AI 医疗助手",
    "inputPlaceholder": "请描述您的症状，例如：我咳嗽三天、发烧38.5、喉咙痛...",
    "submit": "开始分析",
    "analyzing": "AI 正在分析您的症状...",
    "resultTitle": "分析结果",
    "recommendedDepartments": "推荐科室",
    "selectDepartment": "选择该科室",
    "confidenceHigh": "高度匹配",
    "confidenceMedium": "中度匹配",
    "confidenceLow": "低度匹配",
    "riskWarnings": "⚠️ 风险提示",
    "nextSteps": "下一步建议",
    "suggestedTests": "建议检查",
    "howToDescribe": "如何向医生描述",
    "generalAdvice": "一般建议",
    "disclaimer": "免责声明：本功能由 AI 提供，仅供参考，不构成医疗诊断或治疗建议。如有紧急情况，请立即拨打 120 或前往最近的急诊。",
    "retry": "重新咨询",
    "error": "分析失败，请稍后重试",
    "noDepartmentMatch": "建议到综合门诊就诊"
  }
}
```

---

## 四、环境变量

在 `.env` 中新增：

```env
# 阿里通义千问 DashScope API（兼容 OpenAI SDK）
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-turbo
```

---

## 五、依赖安装

```bash
npm install openai
```

> `openai` SDK 同时支持 OpenAI 和阿里通义千问（通过配置 baseURL 指向 DashScope 兼容端点）。

---

## 六、安全与限制

1. **速率限制：** API 路由添加简单的速率限制（如每 IP 每分钟 5 次）
2. **输入长度限制：** 症状描述最多 500 字
3. **免责声明：** 始终展示免责声明，不替代专业医疗诊断
4. **敏感内容过滤：** AI Prompt 中约束不给出具体用药建议，只推荐科室和检查

---

## 七、文件变更清单

### 新增文件（4 个）

1. `app/api/ai/consultation/route.ts` — AI 咨询 API
2. `components/organisms/ai-medical-assistant.tsx` — 主 Dialog 组件
3. `components/molecules/ai-consultation-result.tsx` — 结果渲染组件
4. `lib/ai/consultation.ts` — AI 调用封装（Prompt + 解析逻辑）

### 修改文件（5 个）

1. `app/(root)/page.tsx` — 引入 AI 助手组件
2. `components/organisms/departments-section-client.tsx` — 支持 URL 参数自动打开科室
3. `messages/zh.json` — 新增中文文案
4. `messages/en.json` — 新增英文文案
5. `.env` — 新增通义千问 DashScope API 配置

### 依赖变更

- 新增：`openai`（用于调用通义千问 DashScope 兼容 OpenAI 的端点）

---

## 八、后续扩展（可选）

- [ ] 对话历史：支持多轮对话追问
- [ ] 症状选择器：提供常见症状快捷标签，降低输入门槛
- [ ] 医生智能匹配：根据症状推荐具体医生（而不只是科室）
- [ ] 预约信息预填：将症状描述自动填入预约表单的"就诊原因"字段
