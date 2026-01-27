"use server";

import { endOfDay, startOfDay } from "date-fns";
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

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
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

export async function getDoctorLeaveMonth({
  doctorId,
  year,
  month,
}: {
  doctorId: string;
  year: number;
  month: number;
}): Promise<DoctorLeaveMonthData> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const [leaves, appointments] = await Promise.all([
    prisma.doctorLeave.findMany({
      where: {
        doctorId,
        leaveDate: {
          gte: startOfDay(monthStart),
          lte: endOfDay(monthEnd),
        },
      },
      orderBy: { leaveDate: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentStartUTC: {
          gte: startOfDay(monthStart),
          lte: endOfDay(monthEnd),
        },
      },
      select: { appointmentStartUTC: true },
    }),
  ]);

  return {
    leaves: leaves.map((leave) => ({
      date: leave.leaveDate.toISOString(),
      type: leave.leaveType,
    })),
    blockedDates: appointments.map((item) => item.appointmentStartUTC.toISOString()),
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

  const leaveDate = parseDateOnly(date);

  const appointmentCount = await prisma.appointment.count({
    where: {
      doctorId,
      appointmentStartUTC: {
        gte: startOfDay(leaveDate),
        lte: endOfDay(leaveDate),
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

  const leaveDate = parseDateOnly(date);

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
