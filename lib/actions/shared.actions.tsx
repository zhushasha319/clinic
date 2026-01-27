"use server";

import { ServerActionResponse } from "@/types";
import prisma from "@/db/prisma";
import { AppointmentStatus } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

/**
 * 取消现金支付的预约：校验ID→确认状态为CASH→标记为取消并刷新用户资料页。
 */
export async function cancelCashAppointment(
  appointmentId: string,
): Promise<ServerActionResponse> {
  if (!appointmentId) {
    return {
      success: false,
      message: "需要预约 ID。",
      errorType: "badRequest",
    };
  }
  try {
    // 步骤 1：根据 ID 查找预约
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId },
    });

    // 步骤 2：处理预约不存在的情况
    if (!appointment) {
      return {
        success: false,
        message: "未找到预约。",
        errorType: "notFound",
      };
    }

    // 步骤 3：检查预约状态是否为 CASH
    if (appointment.status !== AppointmentStatus.CASH) {
      return {
        success: false,
        message:
          "该预约无法取消，非现金支付预约。请联系管理员。",
        errorType: "InvalidStatus",
      };
    }

    // 步骤 4：将预约状态更新为 CANCELLED
    const updatedAppointment = await prisma.appointment.update({
      where: { appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });

    revalidatePath(`/user/profile`); //鍒锋柊鐢ㄦ埛涓汉璧勬枡椤甸潰
    // revalidatePath("/admin/appointments");

    // 步骤 6：返回成功响应
    return {
      success: true,
      message: "预约已取消。",
    };
  } catch (error) {
    // 步骤 7：处理意外错误
    console.error("取消现金预约出错：", error);
    return {
      success: false,
      message: "发生意外错误，请稍后再试。",
      error: error instanceof Error ? error.message : "未知错误",
      errorType: "SERVER_ERROR",
    };
  }
}

