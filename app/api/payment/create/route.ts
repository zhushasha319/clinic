import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/db/prisma";
const pingpp = require("pingpp");

// 初始化 Ping++ SDK
// 你需要在 .env 文件中添加 PINGPP_API_KEY 和 PINGPP_APP_ID
pingpp.setPrivateKey(process.env.PINGPP_PRIVATE_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId, amount, channel, clientIp } = body;

    // 验证必要参数
    if (!appointmentId || !amount || !channel) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 验证预约是否存在且属于当前用户
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { user: true, doctor: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "预约不存在" }, { status: 404 });
    }

    // 检查用户权限
    const isOwner = appointment.userId === session.user.id;
    const isGuest = appointment.guestIdentifier === session.user.id;

    if (!isOwner && !isGuest) {
      return NextResponse.json({ error: "无权访问此预约" }, { status: 403 });
    }

    // 检查预约是否已支付
    if (appointment.paymentStatus === "PAID") {
      return NextResponse.json({ error: "预约已支付" }, { status: 400 });
    }

    // 创建 Ping++ Charge 对象
    const orderNo = `ORDER_${appointmentId}_${Date.now()}`;

    const chargeParams = {
      order_no: orderNo,
      app: { id: process.env.PINGPP_APP_ID },
      channel: channel, // 'alipay_wap' for Alipay H5, 'alipay' for Alipay App
      amount: Math.round(amount * 100), // 转换为分
      client_ip: clientIp || req.headers.get("x-forwarded-for") || "127.0.0.1",
      currency: "cny",
      subject: `诊所预约 - ${appointment.doctor.name}`,
      body: `预约日期: ${appointment.date}, 时间: ${appointment.timeSlot}`,
      extra: {
        // 支付宝H5支付需要的额外参数
        ...(channel === "alipay_wap" && {
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/appointments/payment/success?appointmentId=${appointmentId}`,
        }),
      },
      metadata: {
        appointmentId: appointmentId,
        userId: session.user.id,
      },
    };

    // 调用 Ping++ API 创建支付
    const charge = await pingpp.charges.create(chargeParams);

    // 更新预约的支付信息
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: "PENDING",
        paymentOrderNo: orderNo,
        paymentChargeId: charge.id,
      },
    });

    return NextResponse.json({
      success: true,
      charge: charge,
    });
  } catch (error: any) {
    console.error("创建支付订单失败:", error);
    return NextResponse.json(
      { error: error.message || "创建支付订单失败" },
      { status: 500 },
    );
  }
}
