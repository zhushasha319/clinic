"use server";

import { hashSync } from "bcryptjs";
import { format } from "date-fns";
import prisma from "@/db/prisma";
import { AppointmentStatus, Role } from "@/lib/generated/prisma";
import type { ServerActionResponse } from "@/types";
import { auth } from "@/auth";

export type DoctorRow = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  department: string;
  languages: string[];
  specializations: string[];
  brief: string;
};

export type DoctorListResult = {
  rows: DoctorRow[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
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
    return {
      success: false,
      message: "没有权限。",
      errorType: "UNAUTHORIZED",
    };
  }
  return null;
};

export async function getDoctorList({
  page = 1,
  limit = 5,
}: {
  page?: number;
  limit?: number;
}): Promise<DoctorListResult> {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const safePage = Math.max(1, page);

  const whereClause = { role: Role.DOCTOR };

  const totalCount = await prisma.user.count({ where: whereClause });
  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
  const currentPage = Math.min(safePage, totalPages);

  const doctors = await prisma.user.findMany({
    where: whereClause,
    include: {
      doctorProfile: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * safeLimit,
    take: safeLimit,
  });

  const rows = doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name ?? "医生",
    email: doctor.email,
    image: doctor.image,
    department: doctor.doctorProfile?.specialty ?? "未分配",
    languages: doctor.doctorProfile?.languages ?? [],
    specializations: doctor.doctorProfile?.specializations ?? [],
    brief: doctor.doctorProfile?.brief ?? "",
  }));

  return { rows, totalPages, currentPage, totalCount };
}

export async function getDepartments(): Promise<string[]> {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });
  return departments.map((department) => department.name);
}

export async function createDoctor(data: {
  email: string;
  name: string;
  department: string;
  languages: string[];
  specializations: string[];
  brief: string;
  image?: string | null;
}): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  if (!data.email || !data.name) {
    return {
      success: false,
      message: "请填写邮箱和姓名。",
      errorType: "VALIDATION",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return {
      success: false,
      message: "邮箱已存在。",
      errorType: "CONFLICT",
    };
  }

  const password = hashSync("123", 10);
  const doctor = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password,
      role: Role.DOCTOR,
      image: data.image ?? null,
    },
  });

  await prisma.doctorProfile.create({
    data: {
      userId: doctor.id,
      specialty: data.department,
      brief: data.brief,
      credentials: "MD",
      languages: data.languages,
      specializations: data.specializations,
    },
  });

  return { success: true, message: "医生已创建。", data: doctor.id };
}

export async function updateDoctor(data: {
  id: string;
  email: string;
  name: string;
  department: string;
  languages: string[];
  specializations: string[];
  brief: string;
  image?: string | null;
}): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  await prisma.user.update({
    where: { id: data.id },
    data: {
      name: data.name,
      email: data.email,
      image: data.image ?? null,
    },
  });

  const existingProfile = await prisma.doctorProfile.findUnique({
    where: { userId: data.id },
  });

  if (existingProfile) {
    await prisma.doctorProfile.update({
      where: { userId: data.id },
      data: {
        specialty: data.department,
        brief: data.brief,
        credentials: "MD",
        languages: data.languages,
        specializations: data.specializations,
      },
    });
  } else {
    await prisma.doctorProfile.create({
      data: {
        userId: data.id,
        specialty: data.department,
        brief: data.brief,
        credentials: "MD",
        languages: data.languages,
        specializations: data.specializations,
      },
    });
  }

  return { success: true, message: "医生信息已更新。" };
}

export async function deleteDoctor(id: string): Promise<ServerActionResponse> {
  const guard = await ensureAdmin();
  if (guard) return guard;

  try {
    const now = new Date();
    const blockingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        OR: [
          {
            status: {
              in: [AppointmentStatus.BOOKING_CONFIRMED, AppointmentStatus.CASH],
            },
          },
          {
            status: AppointmentStatus.PAYMENT_PENDING,
            OR: [
              { reservationExpiresAt: null },
              { reservationExpiresAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: { appointmentStartUTC: "desc" },
      take: 10,
    });

    if (blockingAppointments.length > 0) {
      return {
        success: false,
        message: "该医生存在待处理预约，无法删除。",
        data: blockingAppointments.map((appointment) => ({
          id: appointment.appointmentId,
          patientName: appointment.patientName,
          slotDate: format(appointment.appointmentStartUTC, "yyyy年M月d日"),
          slotTime: format(appointment.appointmentStartUTC, "HH:mm"),
        })),
        errorType: "HAS_APPOINTMENTS",
      };
    }

    await prisma.$transaction(async (tx) => {
      const appointmentIds = (
        await tx.appointment.findMany({
          where: { doctorId: id },
          select: { appointmentId: true },
        })
      ).map((item) => item.appointmentId);

      if (appointmentIds.length > 0) {
        await tx.transaction.deleteMany({
          where: {
            OR: [{ doctorId: id }, { appointmentId: { in: appointmentIds } }],
          },
        });

        await tx.doctorTestimonial.deleteMany({
          where: {
            OR: [{ doctorId: id }, { appointmentId: { in: appointmentIds } }],
          },
        });

        await tx.appointment.deleteMany({
          where: { doctorId: id },
        });
      }

      await tx.doctorLeave.deleteMany({
        where: { doctorId: id },
      });

      await tx.doctorProfile.deleteMany({
        where: { userId: id },
      });

      await tx.account.deleteMany({
        where: { userId: id },
      });

      await tx.user.delete({ where: { id } });
    });

    return { success: true, message: "医生已删除。" };
  } catch (error) {
    return {
      success: false,
      message: "删除失败，可能存在关联数据。",
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: "SERVER_ERROR",
    };
  }
}
