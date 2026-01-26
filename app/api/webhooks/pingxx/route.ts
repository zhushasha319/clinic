import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  console.log("Ping++ webhook test:", body);

  // ⚠️ 必须返回以 pingxx 开头
  return new NextResponse("pingxx ok");
}
