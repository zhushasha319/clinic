﻿﻿﻿﻿// 逻辑：加载预约数据、鉴权校验、必要时绑定访客预约，并组装传给客户端组件的数据
import PatientDetailsClient from "./patient-details-client";
import type { AppointmentData, PatientData ,AppoitmentWithRelations} from "@/types";
import {
  updateGuestAppointmentWithUser,
  getAppointmentData,
} from "@/lib/actions/appointment/appointment.action";
import { getAppTimeZone } from "@/lib/config";
import { auth } from "@/auth";
import  prisma  from "@/db/prisma";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { redirect } from "next/navigation";
interface PatientDetailsSearchParams {
  appointmentId: string;
  guestIdentifier?: string;
}
function getSessionUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  if (!("user" in session)) return null;
  const user = (session as { user?: unknown }).user;
  if (!user || typeof user !== "object") return null;
  const id = (user as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
function ErrorUI({ title, message }: { title: string; message?: string }) {
  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      {message ? (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
export default async function PatientDetails({
  searchParams,
}: {
  searchParams: Promise<PatientDetailsSearchParams>;
}) {
  const { appointmentId, guestIdentifier } = await searchParams;
  if (!appointmentId) {
    return (
      <ErrorUI
        title="缺少预约信息"
        message="需要提供 appointmentId。"
      />
    );
  }
  // 0) 强制登录：未登录先跳转到登录页，登录后回到本预约页
  const session = await auth();
  if (!session?.user?.id) {
    const params = new URLSearchParams({ appointmentId });
    if (guestIdentifier) {
      params.set("guestIdentifier", guestIdentifier);
    }
    const callbackUrl = `/appointments/patient-details?${params.toString()}`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  // 1) 获取预约预留数据（服务端会校验状态与过期）
  const apptRes = await getAppointmentData({ appointmentId });
  if (!apptRes.success || !apptRes.data) {
    if (apptRes.errorType === "STATUS_CONFLICT") {
      return (
        <ErrorUI
          title="预约状态冲突"
          message={apptRes.message ?? apptRes.error}
        />
      );
    }
    if (apptRes.errorType === "RESERVATION_EXPIRED") {
      return (
        <ErrorUI
          title="预约已过期"
          message={
            apptRes.message ??
            "该预约已过期，请重新选择时段。"
          }
        />
      );
    }
    return (
      <ErrorUI
        title="无法加载预约"
        message={apptRes.message ?? apptRes.error}
      />
    );
  }
  let appointment: AppoitmentWithRelations = apptRes.data;
  // 2) 鉴权：已绑定用户可访问；访客预约登录后可绑定
  const sessionUserId = getSessionUserId(session);
  const appointmentUserId = appointment.userId; // string | null
  const appointmentGuestIdentifier = appointment.guestIdentifier; // string | null
  const isNotExpired =
    appointment.reservationExpiresAt !== null &&
    appointment.reservationExpiresAt > new Date();
  // getAppointmentData 已保证 PAYMENT_PENDING 且未过期，这里多一层保护
  if (!isNotExpired) {
    return (
      <ErrorUI
        title="预约已过期"
        message="请重新选择一个可用时段。"
      />
    );
  }
  // A) 已经绑定用户的预约：必须 sessionUserId 匹配
  const isValidUser =
    sessionUserId !== null &&
    appointmentUserId !== null &&
    appointmentUserId === sessionUserId;
  // B) “guest 已选槽位 → 登录后认领”：session 存在 + 预约未绑定用户 + URL guestIdentifier 匹配
  const shouldLinkGuestToUser =
    sessionUserId !== null &&
    appointmentUserId === null &&
    typeof guestIdentifier === "string" &&
    guestIdentifier.length > 0 &&
    appointmentGuestIdentifier !== null &&
    guestIdentifier === appointmentGuestIdentifier;
  // 仅允许：本人已绑定，或可从访客预约绑定到本人
  if (!isValidUser && !shouldLinkGuestToUser) {
    return (
      <ErrorUI
        title="无权访问"
        message="你无权访问该预约，请重新选择时段。"
      />
    );
  }
  // 3) 如果是访客预约，登录后自动绑定到当前用户
  if (shouldLinkGuestToUser && appointmentGuestIdentifier) {
    const linkRes = await updateGuestAppointmentWithUser(
      appointmentGuestIdentifier
    );
    if (!linkRes.success) {
      if (linkRes.errorType === "AUTHENTICATION_ERROR") {
        return (
          <ErrorUI
            title="请先登录"
            message={linkRes.message ?? linkRes.error}
          />
        );
      }
      if (linkRes.errorType === "RESERVATION_EXPIRED") {
        return (
          <ErrorUI
            title="预约已过期"
            message={
              linkRes.message ??
              "该预约已过期，请重新选择时段。"
            }
          />
        );
      }
      return (
        <ErrorUI
          title="无法绑定预约"
          message={linkRes.message ?? linkRes.error}
        />
      );
    }
    // 4) 重新拉取预约，确保已绑定到当前用户
    const apptRes2 = await getAppointmentData({ appointmentId });
    if (!apptRes2.success || !apptRes2.data) {
      return (
        <ErrorUI
          title="无法加载预约"
          message={apptRes2.message ?? apptRes2.error}
        />
      );
    }
    appointment = apptRes2.data;
    // 绑定后必须属于当前用户
    const linkedOk =
      sessionUserId !== null &&
      appointment.userId !== null &&
      appointment.userId === sessionUserId;
    if (!linkedOk) {
      return (
        <ErrorUI
          title="绑定失败"
          message="该预约无法绑定到你的账号，请重新选择时段。"
        />
      );
    }
  }
  // 4) 拿到用户信息
  let patientDetailsForClient: PatientData = {
    name: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
  };
  if (sessionUserId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: {
        name: true,
        email: true,
        phoneNumber: true, 
        dateofbirth: true, 
      },
    });
    const tz = getAppTimeZone();
    patientDetailsForClient = {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      dateOfBirth: user?.dateofbirth
        ? format(toZonedTime(user.dateofbirth, tz), "yyyy-MM-dd")
        : "",
    };
  }
  // 5) 预约时间从 UTC 转为应用时区
  const tz = getAppTimeZone();
  const startZoned = toZonedTime(appointment.appointmentStartUTC, tz);
  const endZoned = toZonedTime(appointment.appointmentEndUTC, tz);
  const dateStr = format(startZoned, "yyyy-MM-dd");
  const startTimeStr = format(startZoned, "HH:mm");
  const endTimeStr = format(endZoned, "HH:mm");
  const doctorName = appointment.doctor?.name ?? "Doctor";
  const doctorImage = appointment.doctor?.image ?? null;
  // doctorProfile 可能为 null
  const doctorSpecilaity =
    appointment.doctor?.doctorProfile?.specialty ?? "";
  // 6) 为用户端创建 AppointmentData 结构
  const appointmentDataForClient: AppointmentData = {
    appointmentId: appointment.appointmentId,
    doctorId: appointment.doctorId,
    doctorName,
    doctorSpecilaity,
    doctorImage,
    date: dateStr,
    timeSlot: startTimeStr,
    endTime: endTimeStr,
    // 这些来自 Appointment 记录（可能为空）
    patientType:
      appointment.patientType === "SOMEONE_ELSE" ? "SOMEONE_ELSE" : "MYSELF",
    patientName: appointment.patientName ?? undefined,
    patientdateofbirth: appointment.patientdateofbirth ?? null,
    phoneNumber: appointment.phoneNumber ?? null,
    reasonForVisit: appointment.reasonForVisit ?? null,
    additionalNotes: appointment.additionalNotes ?? null,
    relationship: appointment.patientRelation ?? null,
  };
  return (
    <div className="mx-auto max-w-3xl p-6">
      <PatientDetailsClient
        initialAppointmentData={appointmentDataForClient}
        initialPatientDetails={patientDetailsForClient}
      />
    </div>
  );
}
