//预约界面
//实现预约，分为访客和用户预约
//1.访客访问预约表单->验证输入->创建访客标识符->转换时间为UTC->检查时间段可用性->计算保留过期时间->创建预约记录->重新验证医生页面->返回成功负载
"use server";
//预约界面
//2.用户预约->身份验证检查->验证输入->转换时间为UTC->获取保留过期时间->检查现有未过期预约->更新或创建预约记录->重新验证医生页面->返回成功负载
//3.删除过期的预约
//4.获取预约数据->验证输入->检索预约记录->状态冲突检查->过期检查->返回成功负载

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import prisma from "@/db/prisma";
import { getAppTimeZone } from "@/lib/config";
import { auth } from "@/auth";
import {
  GuestAppointmentParams,
  GuestAppointmentSuccessData,
  AppointmentReservationParams,
  ReservationSuccessData,
  ServerActionResponse,
  AppoitmentWithRelations,
  FieldErrors,
  PatientDetailsFormValues,
} from "@/types";
import { parse, isValid } from "date-fns";
import type { ZodIssue } from "zod";
import { PatientDetailsFormSchema } from "@/lib/validations/auth";
import { PatientType, Prisma } from "@/lib/generated/prisma/client";

type AppointmentStatus = "BOOKING_CONFIRMED" | "CASH" | "PAYMENT_PENDING";

/**
 * 检查指定医生在给定起止时间内是否存在未过期的阻塞预约，返回时间段是否可用。
 */
export async function checkSlotAvailability(
  doctorId: string,
  startTime: Date,
  endTime: Date,
  currentAppointmentId?: string,
): Promise<boolean> {
  const now = new Date();

  const blockingStatuses: AppointmentStatus[] = [
    "BOOKING_CONFIRMED",
    "CASH",
    "PAYMENT_PENDING",
  ];

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      appointmentStartUTC: startTime,
      appointmentEndUTC: endTime,
      status: { in: blockingStatuses },
      reservationExpiresAt: { gt: now },
      ...(currentAppointmentId
        ? { appointmentId: { not: currentAppointmentId } }
        : {}),
    },
    select: { appointmentId: true },
  });

  // 没找到冲突 => 可用
  return !conflict;
}

// ---------- Helpers ----------
/** 生成标准化字段错误响应，方便前端展示校验提示。 */
function makeFieldError(field: string, message: string): ServerActionResponse {
  return {
    success: false,
    errorType: "VALIDATION_ERROR",
    fieldErrors: { [field]: [message] },
  };
}

/** 校验字符串是否为 HH:mm 的时间格式。 */
function isValidHHmm(v: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

/** 校验字符串是否为 YYYY-MM-DD 的日期格式。 */
function isValidISODate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/**
 * 创建访客预约：校验输入→生成访客标识→转换时区→检查可用→创建待支付预约。
 */
export async function createGuestAppointment({
  doctorId,
  date,
  startTime,
  endTime,
}: GuestAppointmentParams): Promise<
  ServerActionResponse<GuestAppointmentSuccessData>
> {
  try {
    // 0) Basic validation
    if (!doctorId) return makeFieldError("doctorId", "doctorId is required");
    if (!date || !isValidISODate(date))
      return makeFieldError("date", "date must be in YYYY-MM-DD format");
    if (!startTime || !isValidHHmm(startTime))
      return makeFieldError("startTime", "startTime must be in HH:mm format");
    if (!endTime || !isValidHHmm(endTime))
      return makeFieldError("endTime", "endTime must be in HH:mm format");

    // 1) Create a guest identifier (UUID)
    const guestIdentifier =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // 2) 将应用时区日期+时间转换为数据库用的 UTC Date
    const tz = getAppTimeZone(); // 例如："Asia/Singapore"
    const startLocal = new Date(`${date}T${startTime}:00`);
    const endLocal = new Date(`${date}T${endTime}:00`);

    const appointmentStartUTC = fromZonedTime(startLocal, tz);
    const appointmentEndUTC = fromZonedTime(endLocal, tz);

    if (!(appointmentStartUTC instanceof Date) || isNaN(+appointmentStartUTC)) {
      return makeFieldError("startTime", "Invalid start time");
    }
    if (!(appointmentEndUTC instanceof Date) || isNaN(+appointmentEndUTC)) {
      return makeFieldError("endTime", "Invalid end time");
    }
    if (+appointmentEndUTC <= +appointmentStartUTC) {
      return makeFieldError("endTime", "endTime must be after startTime");
    }

    // 3) 检查时段是否可用（起止时间一致、阻塞状态、未过期）
    const available = await checkSlotAvailability(
      doctorId,
      appointmentStartUTC,
      appointmentEndUTC,
    );

    if (!available) {
      return {
        success: false,
        errorType: "SLOT_UNAVAILABLE",
        message: "该时段已不可用，请选择其他时间。",
      };
    }

    // 4) 从配置计算预留过期时间（默认 10 分钟）
    const settings = await prisma.appSettings.findUnique({
      where: { id: "global" },
      select: { slotReservationDuration: true },
    });

    const durationMinutes =
      settings?.slotReservationDuration && settings.slotReservationDuration > 0
        ? settings.slotReservationDuration
        : 10;

    const reservationExpiresAt = addMinutes(new Date(), durationMinutes);

    // 5) 创建预约记录（访客预留）
    const created = await prisma.appointment.create({
      data: {
        doctorId,
        userId: null,
        guestIdentifier,
        status: "PAYMENT_PENDING",
        reservationExpiresAt,
        appointmentStartUTC,
        appointmentEndUTC,

        // schema 中的必填字段
        patientType: "MYSELF",
        patientName: "Guest",
      },
      select: {
        appointmentId: true,
        guestIdentifier: true,
      },
    });

    // 6) 重新验证医生页面以刷新排班
    revalidatePath(`/doctors/${doctorId}`);

    // 7) 返回成功结果
    return {
      success: true,
      message: "时段已成功预留。",
      data: {
        appointmentId: created.appointmentId,
        guestIdentifier: created.guestIdentifier ?? guestIdentifier,
      },
    };
  } catch (err: unknown) {
    // Prisma 唯一约束竞态等错误可能在这里出现。
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error:
        err instanceof Error
          ? err.message
          : "Failed to create guest appointment",
    };
  }
}
/** 在指定日期基础上增加分钟数，返回新的 Date。 */
function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * 用户预约或更新预约：校验、检查会话、转换时区、占位并返回预约ID。
 */
export async function createOrUpdateAppointmentReservation({
  doctorId,
  userId,
  date,
  startTime,
  endTime,
}: AppointmentReservationParams): Promise<
  ServerActionResponse<ReservationSuccessData>
> {
  try {
    // 1) 权限校验：session 用户必须匹配 userId
    const session = await auth();
    const sessionUserId = (session as { user?: { id?: string } })?.user?.id;

    if (!sessionUserId) {
      return {
        success: false,
        errorType: "UNAUTHORIZED",
        error: "You must be signed in to reserve an appointment.",
      };
    }

    if (sessionUserId !== userId) {
      return {
        success: false,
        errorType: "FORBIDDEN",
        error: "Session user does not match requested userId.",
      };
    }

    // 2) 校验输入
    if (!doctorId) return makeFieldError("doctorId", "doctorId is required");
    if (!userId) return makeFieldError("userId", "userId is required");
    if (!date || !isValidISODate(date))
      return makeFieldError("date", "date must be in YYYY-MM-DD format");
    if (!startTime || !isValidHHmm(startTime))
      return makeFieldError("startTime", "startTime must be in HH:mm format");
    if (!endTime || !isValidHHmm(endTime))
      return makeFieldError("endTime", "endTime must be in HH:mm format");

    // 3) 将门诊本地时间转换为数据库用的 UTC 时间
    const tz = getAppTimeZone();
    const startLocal = new Date(`${date}T${startTime}:00`);
    const endLocal = new Date(`${date}T${endTime}:00`);

    const appointmentStartUTC = fromZonedTime(startLocal, tz);
    const appointmentEndUTC = fromZonedTime(endLocal, tz);

    if (isNaN(+appointmentStartUTC)) {
      return makeFieldError("startTime", "Invalid start time");
    }
    if (isNaN(+appointmentEndUTC)) {
      return makeFieldError("endTime", "Invalid end time");
    }
    if (+appointmentEndUTC <= +appointmentStartUTC) {
      return makeFieldError("endTime", "endTime must be after startTime");
    }

    // 4) 获取预留时长（默认 10）并计算过期时间
    const settings = await prisma.appSettings.findUnique({
      where: { id: "global" },
      select: { slotReservationDuration: true },
    });

    const durationMinutes =
      settings?.slotReservationDuration && settings.slotReservationDuration > 0
        ? settings.slotReservationDuration
        : 10;

    const now = new Date();
    const reservationExpiresAt = addMinutes(now, durationMinutes);

    // 5) 检查用户是否已有该医生未过期的 PAYMENT_PENDING 预留
    const existingPending = await prisma.appointment.findFirst({
      where: {
        doctorId,
        userId,
        status: "PAYMENT_PENDING",
        reservationExpiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        appointmentId: true,
        appointmentStartUTC: true,
        appointmentEndUTC: true,
      },
    });

    let appointmentId: string;

    if (existingPending) {
      // 6a) 重新安排已存在的待支付预留：
      //     重要：冲突检查时需排除自身
      const available = await checkSlotAvailability(
        doctorId,
        appointmentStartUTC,
        appointmentEndUTC,
        existingPending.appointmentId,
      );

      if (!available) {
        return {
          success: false,
          errorType: "SLOT_UNAVAILABLE",
          message:
            "该时段已不可用，请选择其他时间。",
        };
      }

      const updated = await prisma.appointment.update({
        where: { appointmentId: existingPending.appointmentId },
        data: {
          appointmentStartUTC,
          appointmentEndUTC,
          reservationExpiresAt,
        },
        select: { appointmentId: true },
      });

      appointmentId = updated.appointmentId;
    } else {
      // 6b) 创建新的预留
      const available = await checkSlotAvailability(
        doctorId,
        appointmentStartUTC,
        appointmentEndUTC,
      );

      if (!available) {
        return {
          success: false,
          errorType: "SLOT_UNAVAILABLE",
          message:
            "该时段已不可用，请选择其他时间。",
        };
      }

      const created = await prisma.appointment.create({
        data: {
          doctorId,
          userId,
          status: "PAYMENT_PENDING",
          reservationExpiresAt,
          appointmentStartUTC,
          appointmentEndUTC,
          patientType: "MYSELF",
          patientName: "Unknown",
        },
        select: { appointmentId: true },
      });

      appointmentId = created.appointmentId;
    }

    // 7) 重新验证医生排班页面
    revalidatePath(`/doctors/${doctorId}`);

    return {
      success: true,
      message: "Reservation saved.",
      data: { appointmentId },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: err?.message ?? "Failed to reserve appointment slot",
    };
  }
}
/**
 * 清理已过期且仍为待支付状态的预约记录，返回删除数量。
 */
export async function cleanupExpiredReservations(): Promise<ServerActionResponse> {
  try {
    const now = new Date();

    // 删除已过期的 PAYMENT_PENDING 预留
    const result = await prisma.appointment.deleteMany({
      where: {
        status: "PAYMENT_PENDING",
        reservationExpiresAt: { not: null, lte: now },
      },
    });

    return {
      success: true,
      message: `已清理 ${result.count} 条过期预留。`,
      data: { deletedCount: result.count },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: err?.message ?? "Failed to cleanup expired reservations",
    };
  }
}
//预约详情界面-1-填写预约信息-2-支付页面
/**
 * 获取预约详情（含医生信息），同时校验ID必填、状态为待支付且未过期。
 */
export async function getAppointmentData({
  appointmentId,
}: {
  appointmentId: string;
}): Promise<ServerActionResponse<AppoitmentWithRelations>> {
  try {
    if (!appointmentId) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "appointmentId is required",
        fieldErrors: { appointmentId: ["appointmentId is required"] },
      };
    }

    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId },
      include: {
        doctor: {
          include: {
            doctorProfile: true,
          },
        },
      },
    });

    if (!appointment) {
      return {
        success: false,
        errorType: "NOT_FOUND",
        error: "Appointment not found",
        message:
          "We couldn't find this reservation. Please select a slot again.",
      };
    }

    // 状态冲突
    if (appointment.status !== "PAYMENT_PENDING") {
      return {
        success: false,
        errorType: "STATUS_CONFLICT",
        error: "Status conflict",
        message:
          "There is a status conflict. This appointment is no longer in PAYMENT_PENDING state.",
      };
    }

    // 过期检查（缺失 expiresAt 视为已过期以保证安全）
    const now = new Date();
    const expiresAt = appointment.reservationExpiresAt;

    if (!expiresAt || expiresAt <= now) {
      return {
        success: false,
        errorType: "RESERVATION_EXPIRED",
        error: "Reservation expired",
        message:
          "This reservation has expired. Please make a fresh selection of a slot.",
      };
    }

    return {
      success: true,
      message: "预约预留获取成功。",
      data: appointment as AppoitmentWithRelations,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: err?.message ?? "Failed to fetch appointment data",
      message: "获取预约预留时出错。",
    };
  }
}
//用户登录后更新预约信息
/**
 * 登录后将访客预约绑定到当前用户账户，若已绑定则返回成功。
 */
export async function updateGuestAppointmentWithUser(
  guestIdentifier: string,
): Promise<ServerActionResponse<{ appointmentId?: string }>> {
  try {
    // 1) 权限校验
    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session as any)?.user?.id as string | undefined;

    if (!userId) {
      return {
        success: false,
        errorType: "AUTHENTICATION_ERROR",
        error: "User is not authenticated",
        message: "请先登录后继续。",
      };
    }

    if (!guestIdentifier) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "guestIdentifier is required",
        fieldErrors: { guestIdentifier: ["guestIdentifier is required"] },
      };
    }

    const now = new Date();

    // 2) 查找未过期的访客预约
    const appt = await prisma.appointment.findFirst({
      where: {
        guestIdentifier,
        status: "PAYMENT_PENDING",
        reservationExpiresAt: { gt: now },
      },
      select: {
        appointmentId: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!appt) {
      return {
        success: false,
        errorType: "RESERVATION_EXPIRED",
        error: "Guest reservation not found or expired",
        message:
          "This guest reservation is no longer valid. Please select a slot again.",
      };
    }

    // 3) 已关联则视为成功（幂等）
    if (appt.userId === userId) {
      return {
        success: true,
        message: "该预留已关联到你的账号。",
        data: { appointmentId: appt.appointmentId },
      };
    }

    // 若已关联到其他用户则阻止
    if (appt.userId && appt.userId !== userId) {
      return {
        success: false,
        errorType: "FORBIDDEN",
        error: "This reservation is already linked to another user.",
        message:
          "This reservation cannot be linked to your account. Please select a new slot.",
      };
    }

    // 4) 用 userId 更新记录
    const updated = await prisma.appointment.update({
      where: { appointmentId: appt.appointmentId },
      data: { userId },
      select: { appointmentId: true },
    });

    return {
      success: true,
      message: "访客预留已关联到你的账号。",
      data: { appointmentId: updated.appointmentId },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: err?.message ?? "Failed to update guest appointment with user",
      message: "关联预留时发生错误。",
    };
  }
}

//填写信息后进行下一步

/** 将 Zod 校验错误转换为字段 => 错误消息数组的结构。 */
function toFieldErrorsFromZod(issues: ZodIssue[]): FieldErrors {
  const fe: FieldErrors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    fe[key] = fe[key]
      ? [...(fe[key] as string[]), issue.message]
      : [issue.message];
  }
  return fe;
}

/** 按 DD/MM/YYYY 解析生日字符串，失败返回 null。 */
function parseDobDDMMYYYYToDate(value?: string): Date | null {
  if (!value) return null;
  const d = parse(value, "dd/MM/yyyy", new Date());
  return isValid(d) ? d : null;
}

/**
 * 根据应用时区把日期+起止时间字符串转换成对应的 UTC 时间段。
 */
function computeUtcTimes(params: {
  date: string;
  startHHmm: string;
  endHHmm: string;
  tz: string;
}) {
  const { date, startHHmm, endHHmm, tz } = params;
  const startLocal = new Date(`${date}T${startHHmm}:00`);
  const endLocal = new Date(`${date}T${endHHmm}:00`);
  const startUTC = fromZonedTime(startLocal, tz);
  const endUTC = fromZonedTime(endLocal, tz);
  return { startUTC, endUTC };
}

export type AppointmentSubmissionData = PatientDetailsFormValues & {
  appointmentId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD（应用时区）
  timeSlot: string; // HH:mm（应用时区）
  endTime: string; // HH:mm（应用时区）
  isForSelf: boolean;
  phone: string | null | undefined; // 选择的手机号（资料或备用）
  patientdateofbirth?: string; // DD/MM/YYYY（通常仅 SOMEONE_ELSE 使用）
};

interface AppointmentData {
  appointmentId?: string;
}
/**

* 处理预约患者信息提交。

*

* 它处理三种主要场景：

* 1. 如果已有的预约仍然有效，可以更新。

* 2. 如果预约已过期或找不到预约，系统会检查该名额是否仍然空着。

* 3. 如果该名额空闲，系统会根据提交的信息创建新的预约。

*/

export async function processAppointmentBooking(
  data: AppointmentSubmissionData,
): Promise<ServerActionResponse<AppointmentData>> {
  try {
    // 0) 表单验证
    const parsed = PatientDetailsFormSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "Invalid form data",
        message: "请修正高亮字段后重试。",
        fieldErrors: toFieldErrorsFromZod(parsed.error.issues),
      };
    }

    const now = new Date();

    // 1) 检查setting
    const settings = await prisma.appSettings.findUnique({
      where: { id: "global" },
      select: { slotsPerHour: true, slotReservationDuration: true },
    });

    const reservationDurationMinutes =
      settings?.slotReservationDuration && settings.slotReservationDuration > 0
        ? settings.slotReservationDuration
        : 10;

    const reservationExpiresAt = addMinutes(now, reservationDurationMinutes);

    // 2) 转化时间
    const tz = getAppTimeZone();
    const { startUTC, endUTC } = computeUtcTimes({
      date: data.date,
      startHHmm: data.timeSlot,
      endHHmm: data.endTime,
      tz,
    });

    if (
      Number.isNaN(+startUTC) ||
      Number.isNaN(+endUTC) ||
      +endUTC <= +startUTC
    ) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "Invalid time slot",
        message: "请选择有效的时段。",
        fieldErrors: {
          timeSlot: ["Invalid time slot selection."],
        },
      };
    }

    // 3) 尝试找到预约
    const existing = await prisma.appointment.findUnique({
      where: { appointmentId: data.appointmentId },
      select: {
        appointmentId: true,
        doctorId: true,
        userId: true,
        guestIdentifier: true,
        status: true,
        reservationExpiresAt: true,
      },
    });

    const dobDate = parseDobDDMMYYYYToDate(data.patientdateofbirth);
    if (data.patientType === "SOMEONE_ELSE" && !dobDate) {
      // 如果 schema 配置正确，本应已捕获，但这里做安全兜底。
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "Invalid date of birth",
        message: "请输入 DD/MM/YYYY 格式的有效出生日期。",
        fieldErrors: { dateOfBirth: ["Invalid date of birth."] },
      };
    }

    // 创建一个更新/创建预约的负载
    const appointmentWrite: Prisma.AppointmentUncheckedUpdateInput = {
      // core slot fields
      appointmentStartUTC: startUTC,
      appointmentEndUTC: endUTC,
      reservationExpiresAt,

      // patient fields
      patientType: data.patientType as unknown as PatientType,
      patientName: data.fullName,
      patientRelation:
        data.patientType === "SOMEONE_ELSE"
          ? (data.relationship ?? null)
          : null,
      patientdateofbirth: dobDate,

      // contact + notes
      phoneNumber: data.phone ?? null,
      reasonForVisit: data.reason ?? null,
      additionalNotes: data.notes ?? null,

      // keep it pending until payment step
      status: "PAYMENT_PENDING" as AppointmentStatus,
    };

    // 4) 更新预约：如果找到未过期的PAYMENT_PENDING预约，则更新
    if (
      existing &&
      existing.status === "PAYMENT_PENDING" &&
      existing.reservationExpiresAt &&
      existing.reservationExpiresAt > now
    ) {
      // slot检查
      const ok = await checkSlotAvailability(
        data.doctorId,
        startUTC,
        endUTC,
        existing.appointmentId,
      );

      if (!ok) {
        return {
          success: false,
          errorType: "slotUnavailable",
          error: "Slot unavailable",
          message:
            "This slot is no longer available. Please select another slot.",
        };
      }

      const updated = await prisma.appointment.update({
        where: { appointmentId: existing.appointmentId },
        data: appointmentWrite,
        select: { appointmentId: true },
      });

      return {
        success: true,
        message: "预约信息保存成功。",
        data: { appointmentId: updated.appointmentId },
      };
    }

    // 5) 如果没找到合适的，检查slot ,合适就新建一个预约
    const ok = await checkSlotAvailability(data.doctorId, startUTC, endUTC);

    if (!ok) {
      return {
        success: false,
        errorType: "slotUnavailable",
        error: "Slot unavailable",
        message:
          "This slot is no longer available. Please select another slot.",
      };
    }

    //如果有用户ID，则保留
    const userIdToUse = existing?.userId ?? null;
    const guestIdentifierToUse = existing?.guestIdentifier ?? null;

    const created = await prisma.appointment.create({
      data: {
        doctorId: data.doctorId,
        userId: userIdToUse,
        guestIdentifier: guestIdentifierToUse,

        appointmentStartUTC: startUTC,
        appointmentEndUTC: endUTC,
        reservationExpiresAt,

        status: "PAYMENT_PENDING",

        patientType: data.patientType as unknown as PatientType,
        patientName: data.fullName,
        patientRelation:
          data.patientType === "SOMEONE_ELSE"
            ? (data.relationship ?? null)
            : null,
        patientdateofbirth: dobDate,

        phoneNumber: data.phone ?? null,
        reasonForVisit: data.reason ?? null,
        additionalNotes: data.notes ?? null,
      },
      select: { appointmentId: true },
    });

    return {
      success: true,
      message: "Appointment details saved successfully.",
      data: { appointmentId: created.appointmentId },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("processAppointmentBooking error:", error);
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: error?.message ?? "Failed to process appointment booking",
      message: "保存预约信息时出错。",
    };
  }
}


