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
      message: "Appointment ID is required.",
      errorType: "badRequest",
    };
  }
  try {
    // Step 1: Find the appointment by its ID
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId },
    });

    // Step 2: Handle case where appointment is not found
    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found.",
        errorType: "notFound",
      };
    }

    // Step 3: Check if the appointment status is 'CASH'
    if (appointment.status !== AppointmentStatus.CASH) {
      return {
        success: false,
        message:
          "This appointment cannot be cancelled. This is not a cash payment appointment. Please call the Admin",
        errorType: "InvalidStatus",
      };
    }

    // Step 4: Update the appointment status to 'CANCELLED'
    const updatedAppointment = await prisma.appointment.update({
      where: { appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });

    revalidatePath(`/user/profile`); //刷新用户个人资料页面
    // revalidatePath("/admin/appointments");

    // Step 6: Return a success response
    return {
      success: true,
      message: "Appointment successfully cancelled.",
    };
  } catch (error) {
    // Step 7: Handle any unexpected errors
    console.error("Error cancelling cash appointment:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: "SERVER_ERROR",
    };
  }
}
