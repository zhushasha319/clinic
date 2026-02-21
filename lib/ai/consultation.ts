import OpenAI from "openai";

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

export interface DepartmentRecommendation {
  id: string;
  name: string;
  confidence: "高" | "中" | "低";
  reason: string;
}

export interface NextSteps {
  suggestedTests: string[];
  howToDescribe: string;
  generalAdvice: string;
}

export interface ConsultationResult {
  departments: DepartmentRecommendation[];
  riskWarnings: string[];
  nextSteps: NextSteps;
  summary: string;
}

// ---------------------------------------------------------------------------
// 系统 Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `你是一个专业的医疗分导助手。用户会告诉你他们的症状，你需要：

1. 分析症状，推荐 1-3 个最可能的科室（只能从以下科室中选择）：
   - 心内科（dept-cardiology）
   - 神经内科（dept-neurology）
   - 儿科（dept-pediatrics）
   - 骨科（dept-orthopedics）
   - 皮肤科（dept-dermatology）
   - 眼科（dept-ophthalmology）
   如果以上科室都不匹配，返回空的 departments 数组。

2. 给出风险提示：什么情况下需要立即就医。

3. 给出下一步建议：建议做什么检查、怎么跟医生描述病情。

重要：不要给出具体用药建议，只推荐科室和检查。

请严格按照以下 JSON 格式返回（不要返回任何其他内容，不要用 markdown 代码块包裹）：
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
}`;

// ---------------------------------------------------------------------------
// 创建 OpenAI 客户端（指向 DashScope 兼容端点）
// ---------------------------------------------------------------------------

function getClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("缺少环境变量 DASHSCOPE_API_KEY");
  }

  return new OpenAI({
    apiKey,
    baseURL:
      process.env.DASHSCOPE_BASE_URL ||
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });
}

// ---------------------------------------------------------------------------
// 调用 AI 并解析结果
// ---------------------------------------------------------------------------

export async function analyzeSymptoms(
  symptoms: string,
): Promise<ConsultationResult> {
  const client = getClient();
  const model = process.env.DASHSCOPE_MODEL || "qwen-turbo";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: symptoms },
    ],
    temperature: 0.3, // 低温度保证结果稳定
    response_format: { type: "json_object" },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 未返回有效内容");
  }

  // 尝试解析 JSON（兼容 AI 可能用 ```json 包裹的情况）
  const jsonStr = content
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(jsonStr) as ConsultationResult;

  // 验证结构完整性
  if (
    !parsed.departments ||
    !parsed.riskWarnings ||
    !parsed.nextSteps ||
    !parsed.summary
  ) {
    throw new Error("AI 返回的数据结构不完整");
  }

  // 过滤掉不在允许列表中的科室 ID
  const validDeptIds = new Set([
    "dept-cardiology",
    "dept-neurology",
    "dept-pediatrics",
    "dept-orthopedics",
    "dept-dermatology",
    "dept-ophthalmology",
  ]);
  parsed.departments = parsed.departments.filter((d) => validDeptIds.has(d.id));

  return parsed;
}
