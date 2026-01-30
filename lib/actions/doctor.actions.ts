"use server";
import {
  ServerActionResponse,
  DoctorSummary,
  DoctorReview,
  DoctorDetails,
  TimeSlot,
} from "@/types";
import prisma from "@/db/prisma";
import { Role, AppointmentStatus, LeaveType } from "@/lib/generated/prisma";
import { getAppTimeZone } from "@/lib/config";
import { addMinutes } from "date-fns";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";

/** 获取所有活跃医生的概要信息（头像、专长、评分统计）。 */
export async function getOurDoctors(): Promise<
  ServerActionResponse<DoctorSummary[]>
> {
  try {
    // 获取角色为 DOCTOR 且资料已激活的用户。
    // 使用 `select` 只查询必要字段以提高效率。
    const doctors = await prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        doctorProfile: {
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        image: true, // This will be mapped to imageUrl
        doctorProfile: {
          select: {
            specialty: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: {
        // 可选：可以按评分或姓名排序
        doctorProfile: {
          rating: "desc",
        },
      },
    });

    // `where` 已保证 `doctorProfile` 非空，但仍建议做安全处理。
    if (!doctors || doctors.length === 0) {
      return {
        success: true,
        data: [], // Return empty array if no doctors found
      };
    }

    const doctorIds = doctors.map((doc) => doc.id);
    const reviewAggregates = await prisma.doctorTestimonial.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: {
          in: doctorIds,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        testimonialId: true,
      },
    });

    const statsMap = new Map(
      reviewAggregates.map((stat) => [
        stat.doctorId,
        {
          averageRating: Number(stat._avg?.rating ?? 0),
          totalReviews: Number(stat._count?.testimonialId ?? 0),
        },
      ]),
    );

    // 将数据映射为 DoctorSummary 结构。
    const formattedDoctors: DoctorSummary[] = doctors.map((doc) => ({
      id: doc.id,
      name: doc.name,
      imageUrl: doc.image,
      specialty: doc.doctorProfile?.specialty ?? "N/A",
      rating:
        statsMap.get(doc.id)?.averageRating ??
        Number(doc.doctorProfile?.rating ?? 0),
      reviewCount:
        statsMap.get(doc.id)?.totalReviews ??
        Number(doc.doctorProfile?.reviewCount ?? 0),
    }));

    // 返回格式化后的医生数据成功响应。
    return {
      success: true,
      data: formattedDoctors,
    };
  } catch (error) {
    // 记录详细错误，便于服务端排查。
    console.error("Error fetching our doctors:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );

    // 向客户端返回通用错误响应。
    return {
      success: false,
      message: "获取医生信息时发生意外错误。",
      error: error instanceof Error ? error.message : String(error),
      errorType: "DatabaseError",
    };
  }
}

/** 获取指定医生的评价列表，并转换为应用时区格式。 */
export async function getDoctorTestimonials(
  doctorId: string,
): Promise<ServerActionResponse<DoctorReview[]>> {
  try {
    const { format, toZonedTime } = await import("date-fns-tz");

    // 获取指定医生的评价
    const testimonials = await prisma.doctorTestimonial.findMany({
      where: {
        doctorId: doctorId,
      },
      select: {
        testimonialId: true,
        testimonialText: true,
        rating: true,
        createdAt: true,
        patient: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!testimonials || testimonials.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // 映射并格式化评价（含时区转换）
    const formattedTestimonials: DoctorReview[] = testimonials.map(
      (testimonial: (typeof testimonials)[0]) => {
        // 将 UTC 时间转换为应用时区
        const zonedDate = toZonedTime(testimonial.createdAt, getAppTimeZone());
        const formattedDate = format(zonedDate, "MMM dd, yyyy", {
          timeZone: getAppTimeZone(),
        });

        return {
          id: testimonial.testimonialId,
          rating: testimonial.rating ?? 0,
          reviewDate: formattedDate,
          testimonialText: testimonial.testimonialText,
          patientName: testimonial.patient.name ?? "匿名",
          patientImage: testimonial.patient.image,
        };
      },
    );

    return {
      success: true,
      data: formattedTestimonials,
    };
  } catch (error) {
    console.error("Error fetching doctor testimonials:", error);

    return {
      success: false,
      message: "获取评价时发生意外错误。",
      error: error instanceof Error ? error.message : String(error),
      errorType: "DatabaseError",
    };
  }
}

/** ??????????????????????? */
export async function getDoctorDetails(
  doctorId: string,
): Promise<ServerActionResponse<DoctorDetails>> {
  try {
    if (!doctorId?.trim()) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "doctorId is required",
        message: "请求无效",
      };
    }

    // DoctorDetails 中的医生 "id" 视为 User.id（医生用户 id），
    // 因 DoctorProfile 以 userId 为键，User 保存 name/image。
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        doctorProfile: {
          select: {
            credentials: true,
            specialty: true,
            rating: true,
            reviewCount: true,
            languages: true,
            specializations: true,
            brief: true,
            isActive: true,
          },
        },
      },
    });

    if (!doctor) {
      return {
        success: false,
        errorType: "NOT_FOUND",
        error: "未找到医生",
        message: "未找到医生",
      };
    }

    if (doctor.role !== "DOCTOR") {
      return {
        success: false,
        errorType: "NOT_A_DOCTOR",
        error: "该用户不是医生",
        message: "该用户不是医生",
      };
    }

    if (!doctor.doctorProfile) {
      return {
        success: false,
        errorType: "PROFILE_MISSING",
        error: "未找到医生资料",
        message: "未找到医生资料",
      };
    }

    if (!doctor.doctorProfile.isActive) {
      return {
        success: false,
        errorType: "INACTIVE",
        error: "医生未激活",
        message: "医生当前未激活",
      };
    }

    const details: DoctorDetails = {
      id: doctor.id,
      name: doctor.name ?? "NO_NAME",
      image: doctor.image ?? null,
      credentials: doctor.doctorProfile.credentials,
      speciality: doctor.doctorProfile.specialty, // 注意：DoctorDetails 使用 "speciality"
      rating: Number(doctor.doctorProfile.rating ?? 0),
      reviewCount: Number(doctor.doctorProfile.reviewCount ?? 0),
      languages: doctor.doctorProfile.languages ?? [],
      specializations: doctor.doctorProfile.specializations ?? [],
      brief: doctor.doctorProfile.brief,
    };

    return {
      success: true,
      message: "医生详情获取成功",
      data: details,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "发生未知错误";

    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: message,
      message: "获取医生详情失败",
    };
  }
}

interface GetAvailableSlotsParams {
  doctorId: string;
  date: string; // 格式：YYYY - MM-DD
  currentUserId?: string;
}

/**
 * 计算医生在给定日期的可用时间段：生成全部slot→扣除请假/已占用/过期→过滤过去时间。
 */
export async function getAvailableDoctorSlots({
  doctorId,
  date,
  currentUserId,
}: GetAvailableSlotsParams): Promise<ServerActionResponse<TimeSlot[]>> {
  try {
    const timeZone = getAppTimeZone();

    // 1. 获取应用配置
    const settings = await prisma.appSettings.findFirst();
    const slotsPerHour = settings?.slotsPerHour ?? 2;
    const startTimeConfig = settings?.startTime ?? "09:00";
    const endTimeConfig = settings?.endTime ?? "17:00";
    const slotDuration = 60 / slotsPerHour;

    // 2. 日期设置
    // 构造该日期 00:00:00 的 ISO 字符串
    // 再用 fromZonedTime 获取该时区 00:00 对应的 UTC 时间点。
    const startOfDayUTC = fromZonedTime(`${date} 00:00:00`, timeZone);

    // 再基于该天计算时段的 UTC 起止时间
    const workDayStartUTC = fromZonedTime(
      `${date} ${startTimeConfig}`,
      timeZone,
    );
    const workDayEndUTC = fromZonedTime(`${date} ${endTimeConfig}`, timeZone);

    // 3. 生成主时间段列表
    const allSlots: TimeSlot[] = [];
    let current = workDayStartUTC;

    while (current < workDayEndUTC) {
      const slotEnd = addMinutes(current, slotDuration);
      if (slotEnd > workDayEndUTC) break;

      allSlots.push({
        startTime: format(toZonedTime(current, timeZone), "HH:mm", {
          timeZone,
        }),
        endTime: format(toZonedTime(slotEnd, timeZone), "HH:mm", { timeZone }),
        startTimeUTC: current,
        endTimeUTC: slotEnd,
      });

      current = slotEnd;
    }

    // 4. 过滤可用时段

    // 4.1 医生请假
    // 假设 leaveDate 为该日 UTC 零点或简单日期字符串
    const leaveDate = new Date(date);

    const doctorLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        leaveDate: leaveDate,
      },
    });

    if (doctorLeave) {
      if (doctorLeave.leaveType === LeaveType.FULL_DAY) {
        return { success: true, data: [] };
      }

      // 应用时区 13:00 转为 UTC
      const splitTimeUTC = fromZonedTime(`${date} 13:00:00`, timeZone);

      if (doctorLeave.leaveType === LeaveType.MORNING) {
        // 移除 13:00 之前的时段
        const filtered = allSlots.filter(
          (slot) => slot.startTimeUTC >= splitTimeUTC,
        );
        allSlots.length = 0;
        allSlots.push(...filtered);
      } else if (doctorLeave.leaveType === LeaveType.AFTERNOON) {
        // 移除 13:00 之后（含）的时段
        const filtered = allSlots.filter(
          (slot) => slot.startTimeUTC < splitTimeUTC,
        );
        allSlots.length = 0;
        allSlots.push(...filtered);
      }
    }

    // 4.2 已有预约
    const nextDayUTC = addMinutes(startOfDayUTC, 24 * 60);

    const dayAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentStartUTC: {
          gte: startOfDayUTC,
          lt: nextDayUTC,
        },
      },
    });

    const takenStartTimes = new Set<number>();
    const now = new Date();

    dayAppointments.forEach((appt) => {
      // 条件：已预约或现金支付
      if (
        appt.status === AppointmentStatus.BOOKING_CONFIRMED ||
        appt.status === AppointmentStatus.CASH
      ) {
        takenStartTimes.add(appt.appointmentStartUTC.getTime());
      }
      // 条件：待支付且未过期且非当前用户
      else if (appt.status === AppointmentStatus.PAYMENT_PENDING) {
        const isMyBooking = currentUserId && appt.userId === currentUserId;
        if (
          !isMyBooking &&
          appt.reservationExpiresAt &&
          appt.reservationExpiresAt > now
        ) {
          takenStartTimes.add(appt.appointmentStartUTC.getTime());
        }
      }
    });

    let availableSlots = allSlots.filter(
      (slot) => !takenStartTimes.has(slot.startTimeUTC.getTime()),
    );

    // 4.3 过去的时段
    // 过滤当前时间之前的时段。
    // 同时处理“今天”的过期时段与过期日期。
    const nowTime = now.getTime();
    availableSlots = availableSlots.filter(
      (slot) => slot.startTimeUTC.getTime() > nowTime,
    );

    return {
      success: true,
      data: availableSlots,
    };
  } catch (error) {
    console.error("Error getting available slots:", error);
    return {
      success: false,
      message: "获取可用时段失败",
      error: String(error),
    };
  }
}

interface PendingAppointmentParams {
  userId: string;
  doctorId: string;
}

interface PendingAppointmentData {
  appointment: {
    appointmentId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  } | null;
}

/**
 * 获取用户在指定医生处的待支付预约（若有且未过期）。
 */
export async function getPendingAppointmentForDoctor({
  userId,
  doctorId,
}: PendingAppointmentParams): Promise<
  ServerActionResponse<PendingAppointmentData>
> {
  try {
    if (!userId?.trim() || !doctorId?.trim()) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "Missing userId or doctorId",
        message: "请求无效",
      };
    }

    const now = new Date();
    // 查找最近且未过期的待支付预约
    const pendingAppt = await prisma.appointment.findFirst({
      where: {
        userId,
        doctorId,
        status: AppointmentStatus.PAYMENT_PENDING,
        // 确认预约仍有效
        reservationExpiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: "desc", // 如有多条则取最新（理论上不应出现）
      },
    });

    if (!pendingAppt) {
      return {
        success: true,
        data: {
          appointment: null,
        },
      };
    }

    // 将存储的 UTC 时间转换为应用时区用于展示
    const timeZone = getAppTimeZone();
    const zonedStart = toZonedTime(pendingAppt.appointmentStartUTC, timeZone);
    const zonedEnd = toZonedTime(pendingAppt.appointmentEndUTC, timeZone);

    const dateStr = format(zonedStart, "yyyy-MM-dd", { timeZone });
    const startTimeStr = format(zonedStart, "HH:mm", { timeZone });
    const endTimeStr = format(zonedEnd, "HH:mm", { timeZone });

    return {
      success: true,
      data: {
        appointment: {
          appointmentId: pendingAppt.appointmentId,
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          status: pendingAppt.status,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching pending appointment:", error);
    return {
      success: false,
      message: "获取待处理预约失败",
      error: String(error),
    };
  }
}
