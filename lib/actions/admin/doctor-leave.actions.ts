"use server";

import prisma from "@/db/prisma";
import { LeaveType } from "@/lib/generated/prisma";
import type { ServerActionResponse } from "@/types";
import { auth } from "@/auth";

export type DoctorLeaveDay = {
  date: string;
  type: LeaveType;
};

export type DoctorLeaveMonthData = {
  leaves: DoctorLeaveDay[];
  blockedDates: string[];
};

// 将 "yyyy-MM-dd" 字符串解析为 UTC 午夜时间
const parseDateToUTC = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

// 将 Date 对象格式化为 "yyyy-MM-dd" 字符串（基于 UTC）
const formatDateFromUTC = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ensureAdmin = async (): Promise<ServerActionResponse | null> => {
  const session = await auth();
  if (!session?.user) {
    return {
      success: false,
      message: "请先登录。",
      errorType: "AUTHENTICATION",
    };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, message: "没有权限。", errorType: "UNAUTHORIZED" };
  }
  return null;
};

export async function getDoctorLeaveMonth({
  doctorId,
  year,
  month,
}: {
  doctorId: string;
  year: number;
  month: number;
}): Promise<DoctorLeaveMonthData> {
  // 使用 UTC 时间构建月份范围
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [leaves, appointments] = await Promise.all([
    prisma.doctorLeave.findMany({
      where: {
        doctorId,
        leaveDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: { leaveDate: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentStartUTC: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: { appointmentStartUTC: true },
    }),
  ]);

  return {
    leaves: leaves.map((leave) => ({
      date: formatDateFromUTC(leave.leaveDate),
      type: leave.leaveType,
    })),
    blockedDates: appointments.map((item) =>
      formatDateFromUTC(item.appointmentStartUTC),
    ),
  };
}

export async function setDoctorLeave({
  doctorId,
  date,
  type,
}: {
  doctorId: string;
  date: string;
  type: LeaveType;
}): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  const leaveDate = parseDateToUTC(date);

  // 使用 UTC 时间范围检查预约
  const dayStart = new Date(
    Date.UTC(
      leaveDate.getUTCFullYear(),
      leaveDate.getUTCMonth(),
      leaveDate.getUTCDate(),
    ),
  );
  const dayEnd = new Date(
    Date.UTC(
      leaveDate.getUTCFullYear(),
      leaveDate.getUTCMonth(),
      leaveDate.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  const appointmentCount = await prisma.appointment.count({
    where: {
      doctorId,
      appointmentStartUTC: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  if (appointmentCount > 0) {
    return {
      success: false,
      message: "该日期已有预约，无法请假。",
      errorType: "HAS_APPOINTMENTS",
    };
  }

  const existing = await prisma.doctorLeave.findUnique({
    where: {
      doctorId_leaveDate: {
        doctorId,
        leaveDate,
      },
    },
  });

  if (existing) {
    await prisma.doctorLeave.update({
      where: { leaveId: existing.leaveId },
      data: { leaveType: type },
    });
  } else {
    await prisma.doctorLeave.create({
      data: {
        doctorId,
        leaveDate,
        leaveType: type,
      },
    });
  }

  return { success: true, message: "请假已更新。" };
}

export async function removeDoctorLeave({
  doctorId,
  date,
}: {
  doctorId: string;
  date: string;
}): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  const leaveDate = parseDateToUTC(date);

  await prisma.doctorLeave.delete({
    where: {
      doctorId_leaveDate: {
        doctorId,
        leaveDate,
      },
    },
  });

  return { success: true, message: "请假已移除。" };
}
