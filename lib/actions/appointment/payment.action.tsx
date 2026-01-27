"use server";

import prisma from "@/db/prisma";
import { AppointmentStatus } from "@/lib/generated/prisma";
import { ServerActionResponse } from "@/types";

// 初始化 pingpp
const pingpp = require("pingpp")(process.env.PINGPP_API_KEY || "");

// 设置私钥用于签名
if (process.env.PINGPP_PRIVATE_KEY) {
  pingpp.setPrivateKey(process.env.PINGPP_PRIVATE_KEY);
}

export async function confirmCashAppointment(
  appointmentId: string,
): Promise<ServerActionResponse> {
  // 1. 查找预约
  const existingAppointment = await prisma.appointment.findUnique({
    where: { appointmentId },
  });

  if (!existingAppointment) {
    return {
      success: false,
      message: "Appointment not found.",
      errorType: "NOT_FOUND",
    };
  }

  // 2. 确认预约状态为 PAYMENT_PENDING
  if (existingAppointment.status !== AppointmentStatus.PAYMENT_PENDING) {
    return {
      success: false,
      message: `Action cannot be completed. Appointment status is '${existingAppointment.status}'.`,
      errorType: "STATUS_CONFLICT",
    };
  }

  // 3. 更新预约状态为 CASH (等待现金支付)
  await prisma.appointment.update({
    where: {
      appointmentId: existingAppointment.appointmentId,
    },
    data: {
      status: AppointmentStatus.CASH, // 设置状态为 CASH (等待支付)
      paymentMethod: "CASH", // 设置支付方式为现金
      paymentStatus: "PENDING", // 支付状态为待支付
      reservationExpiresAt: null, // 清除预约过期时间
    },
  });

  return {
    success: true,
    message: "Cash payment method confirmed. Awaiting payment.",
  };
}

export async function updateAppointmentToPaid({
  appointmentId,
  paymentResult,
}: {
  appointmentId: string;
  paymentResult: {
    id: string;
    status: string;
    email_address: string;
    pricePaid: string | number;
  };
}) {
  const { id, status, pricePaid, email_address } = paymentResult;

  const updatedAppointment = await prisma.appointment.update({
    where: { appointmentId },
    data: {
      paymentResult: {
        id,
        status,
        email_address,
        pricePaid,
      },
      paymentStatus: "PAID", // 标记为已支付
      paymentCompletedAt: new Date(), // 支付完成时间
      status: AppointmentStatus.BOOKING_CONFIRMED, // 更新状态为已确认
      reservationExpiresAt: null, // 清除过期时间
    },
  });

  return {
    success: true,
    message: "Appointment updated to paid",
    data: updatedAppointment,
  };
}

/**
 * 创建支付宝支付订单
 */
export async function createAlipayPayment({
  appointmentId,
  amount,
  userId,
  clientIp,
}: {
  appointmentId: string;
  amount: number;
  userId: string;
  clientIp?: string;
}): Promise<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ServerActionResponse<{ charge: any }>
> {
  try {
    // 验证预约是否存在
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId },
      include: { doctor: true },
    });

    if (!appointment) {
      return {
        success: false,
        error: "预约不存在",
        errorType: "NOT_FOUND",
      };
    }

    // 检查用户权限
    const isOwner = appointment.userId === userId;
    const isGuest = appointment.guestIdentifier === userId;

    if (!isOwner && !isGuest) {
      return {
        success: false,
        error: "无权访问此预约",
        errorType: "UNAUTHORIZED",
      };
    }

    // 检查预约是否已支付
    if (appointment.paymentStatus === "PAID") {
      return {
        success: false,
        error: "预约已支付",
        errorType: "ALREADY_PAID",
      };
    }

    // 创建订单号(移除连字符以符合 Ping++ 格式要求)
    const orderNo = `ORDER_${appointmentId.replace(/-/g, "")}_${Date.now()}`;

    // 创建 Ping++ Charge 对象
    const chargeParams = {
      order_no: orderNo,
      app: { id: process.env.PINGPP_APP_ID },
      channel: "alipay_wap", // 支付宝H5支付
      amount: Math.round(amount * 100), // 转换为分
      client_ip: clientIp || "127.0.0.1",
      currency: "cny", 
      subject: `诊所预约 - ${appointment.doctor.name}`,
      body: `预约日期: ${new Date(appointment.appointmentStartUTC).toLocaleDateString()}`,
      extra: {
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/appointments/payment/success?appointmentId=${appointmentId}`,
      },
      metadata: {
        appointmentId: appointmentId,
        userId: userId,
      },
    };

    // 调用 Ping++ API 创建支付
    const charge = await pingpp.charges.create(chargeParams);

    // 更新预约的支付信息
    await prisma.appointment.update({
      where: { appointmentId },
      data: {
        paymentStatus: "PENDING",
        paymentOrderNo: orderNo,
        paymentChargeId: charge.id,
      },
    });

    return {
      success: true,
      data: { charge },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("创建支付订单失败:", error);
    return {
      success: false,
      error: error.message || "创建支付订单失败",
      errorType: "PAYMENT_ERROR",
    };
  }
}

/**
 * 处理支付宝支付成功回调 (Webhook)
 */
export async function handleAlipayWebhook(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webhookData: any,
): Promise<ServerActionResponse> {
  try {
    const { type, data } = webhookData;

    // 处理支付成功事件
    if (type === "charge.succeeded") {
      const charge = data.object;
      const appointmentId = charge.metadata?.appointmentId;

      if (!appointmentId) {
        return {
          success: false,
          error: "Webhook 数据中缺少 appointmentId",
          errorType: "INVALID_DATA",
        };
      }

      // 更新预约支付状态
      await prisma.appointment.update({
        where: { appointmentId },
        data: {
          paymentStatus: "PAID",
          paymentMethod: "ALIPAY",
          paymentTransactionId: charge.transaction_no,
          paymentCompletedAt: new Date(),
          status: AppointmentStatus.BOOKING_CONFIRMED,
          reservationExpiresAt: null,
        },
      });

      return {
        success: true,
        message: `预约 ${appointmentId} 支付成功`,
      };
    }

    // 处理支付失败事件
    if (type === "charge.failed") {
      const charge = data.object;
      const appointmentId = charge.metadata?.appointmentId;

      if (appointmentId) {
        // 支付失败,恢复预约状态为待支付,允许用户重新支付
        await prisma.appointment.update({
          where: { appointmentId },
          data: {
            paymentStatus: "FAILED",
            status: AppointmentStatus.PAYMENT_PENDING, // 恢复为待支付状态
            paymentChargeId: null, // 清除失败的 Charge ID
            paymentOrderNo: null, // 清除订单号
          },
        });
      }

      return {
        success: true,
        message: `预约 ${appointmentId} 支付失败,已恢复为待支付状态`,
      };
    }

    return {
      success: true,
      message: "Webhook 事件已接收",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("处理 Webhook 失败:", error);
    return {
      success: false,
      error: error.message || "处理失败",
      errorType: "WEBHOOK_ERROR",
    };
  }
}
