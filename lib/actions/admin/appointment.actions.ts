"use server";

import { format } from "date-fns";
import prisma from "@/db/prisma";
import { AppointmentStatus, TransactionStatus } from "@/lib/generated/prisma";
import type { ServerActionResponse } from "@/types";
import { auth } from "@/auth";

export type AppointmentRow = {
  id: string;
  doctorName: string;
  patientName: string;
  phoneNumber: string;
  bookedBy: string;
  slotDate: string;
  slotTime: string;
  status: AppointmentStatus;
  statusLabel: string;
};

const statusLabelMap: Record<AppointmentStatus, string> = {
  PAYMENT_PENDING: "待支付",
  BOOKING_CONFIRMED: "待就诊",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  NO_SHOW: "未到诊",
  CASH: "柜台支付",
};

const ensureAdmin = async (): Promise<ServerActionResponse | null> => {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "请先登录。", errorType: "AUTHENTICATION" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, message: "没有权限。", errorType: "UNAUTHORIZED" };
  }
  return null;
};

export type AppointmentSearchResult = {
  rows: AppointmentRow[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
};

export async function searchAppointmentsByPatientName({
  query,
  page = 1,
  limit = 5,
}: {
  query?: string;
  page?: number;
  limit?: number;
}): Promise<AppointmentSearchResult> {
  const keyword = query?.trim();
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const safePage = Math.max(1, page);

  const whereClause = {
    status: {
      in: [AppointmentStatus.CASH, AppointmentStatus.BOOKING_CONFIRMED],
    },
    ...(keyword
      ? {
          patientName: {
            contains: keyword,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const totalCount = await prisma.appointment.count({
    where: whereClause,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
  const currentPage = Math.min(safePage, totalPages);

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      doctor: true,
      user: true,
    },
    orderBy: {
      appointmentStartUTC: "desc",
    },
    skip: (currentPage - 1) * safeLimit,
    take: safeLimit,
  });

  const rows = appointments.map((appointment) => ({
    id: appointment.appointmentId,
    doctorName: appointment.doctor.name ?? "医生",
    patientName: appointment.patientName,
    phoneNumber: appointment.phoneNumber ?? "-",
    bookedBy: appointment.user?.name ?? appointment.patientName,
    slotDate: format(appointment.appointmentStartUTC, "yyyy年M月d日"),
    slotTime: format(appointment.appointmentStartUTC, "HH:mm"),
    status: appointment.status,
    statusLabel: statusLabelMap[appointment.status],
  }));

  return {
    rows,
    totalPages,
    currentPage,
    totalCount,
  };
}

export async function markCashAsPaid(
  appointmentId: string,
): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
  });

  if (!appointment) {
    return { success: false, message: "未找到预约。", errorType: "NOT_FOUND" };
  }

  if (appointment.status !== AppointmentStatus.CASH) {
    return {
      success: false,
      message: "当前预约无法标记为已支付。",
      errorType: "STATUS_CONFLICT",
    };
  }

  await prisma.appointment.update({
    where: { appointmentId },
    data: {
      status: AppointmentStatus.BOOKING_CONFIRMED,
      paidAt: new Date(),
      paymentStatus: "PAID",
      paymentCompletedAt: new Date(),
    },
  });

  return { success: true, message: "已标记为待就诊。" };
}

export async function markAppointmentCancelled(
  appointmentId: string,
): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
  });

  if (!appointment) {
    return { success: false, message: "未找到预约。", errorType: "NOT_FOUND" };
  }

  await prisma.appointment.update({
    where: { appointmentId },
    data: {
      status: AppointmentStatus.CANCELLED,
    },
  });

  const latestTransaction = await prisma.transaction.findFirst({
    where: { appointmentId },
    orderBy: { transactionDate: "desc" },
  });

  if (latestTransaction) {
    await prisma.transaction.update({
      where: { id: latestTransaction.id },
      data: {
        status: TransactionStatus.CANCELLED,
        notes: "管理员取消预约，需退回款项。",
      },
    });
  }

  return { success: true, message: "预约已取消，退款处理中。" };
}

export async function markAppointmentNoShow(
  appointmentId: string,
): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  await prisma.appointment.update({
    where: { appointmentId },
    data: {
      status: AppointmentStatus.NO_SHOW,
    },
  });

  return { success: true, message: "已标记为未到诊。" };
}

export async function markAppointmentCompleted(
  appointmentId: string,
): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  await prisma.appointment.update({
    where: { appointmentId },
    data: {
      status: AppointmentStatus.COMPLETED,
      paidAt: new Date(),
    },
  });

  return { success: true, message: "已标记为完成。" };
}
