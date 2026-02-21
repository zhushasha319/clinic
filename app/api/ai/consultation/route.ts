import { NextRequest, NextResponse } from "next/server";
import { analyzeSymptoms } from "@/lib/ai/consultation";

// 简单的内存速率限制：每 IP 每分钟 5 次
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000; // 1 分钟

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // 获取客户端 IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // 速率限制检查
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: "请求过于频繁，请稍后再试" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { symptoms } = body;

    // 输入验证
    if (!symptoms || typeof symptoms !== "string") {
      return NextResponse.json(
        { success: false, message: "请输入症状描述" },
        { status: 400 },
      );
    }

    const trimmed = symptoms.trim();
    if (trimmed.length < 2) {
      return NextResponse.json(
        { success: false, message: "症状描述过短，请详细描述" },
        { status: 400 },
      );
    }

    if (trimmed.length > 500) {
      return NextResponse.json(
        { success: false, message: "症状描述不能超过 500 字" },
        { status: 400 },
      );
    }

    // 调用 AI 分析
    const result = await analyzeSymptoms(trimmed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[AI Consultation Error]", error);

    const message =
      error instanceof Error ? error.message : "分析失败，请稍后重试";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
