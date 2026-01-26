import { NextRequest, NextResponse } from "next/server";
import { handleAlipayWebhook } from "@/lib/actions/appointment/payment.action";

export async function POST(req: NextRequest) {
  try {
    // 获取 Ping++ 的签名
    const signature = req.headers.get("x-pingplusplus-signature");

    if (!signature) {
      return NextResponse.json({ error: "无效的签名" }, { status: 400 });
    }

    // 获取原始 body
    const rawBody = await req.text();

    // 验证签名 (需要配置 Ping++ 公钥)
    const webhookData = JSON.parse(rawBody);

    // 验证签名的逻辑根据 Ping++ 文档实现
    // const isValid = pingpp.webhooks.verifySignature(rawBody, signature, process.env.PINGPP_PUBLIC_KEY);
    // if (!isValid) {
    //   return NextResponse.json({ error: "签名验证失败" }, { status: 400 });
    // }

    console.log("收到 Webhook 事件:", webhookData.type);

    // 调用 server action 处理 webhook
    const result = await handleAlipayWebhook(webhookData);

    if (!result.success) {
      console.error("处理 Webhook 失败:", result.error);
      return NextResponse.json(
        { error: result.error || "处理失败" },
        { status: 400 },
      );
    }

    console.log(result.message);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("处理 Webhook 失败:", error);
    return NextResponse.json(
      { error: error.message || "处理失败" },
      { status: 500 },
    );
  }
    return new NextResponse("pingxx ok");
}
