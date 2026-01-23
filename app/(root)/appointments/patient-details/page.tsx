//逻辑：加载预约数据，授权检查，必要时将访客预约链接到用户，获取用户信息，准备传递给客户端组件的数据结构
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
        title="Missing appointment"
        message="appointmentId is required."
      />
    );
  }

  //1.找到预约信息
  const apptRes = await getAppointmentData({ appointmentId });

  if (!apptRes.success || !apptRes.data) {
    if (apptRes.errorType === "STATUS_CONFLICT") {
      return (
        <ErrorUI
          title="Status conflict"
          message={apptRes.message ?? apptRes.error}
        />
      );
    }

    if (apptRes.errorType === "RESERVATION_EXPIRED") {
      return (
        <ErrorUI
          title="Reservation expired"
          message={
            apptRes.message ??
            "This reservation has expired. Please select a slot again."
          }
        />
      );
    }

    return (
      <ErrorUI
        title="Unable to load reservation"
        message={apptRes.message ?? apptRes.error}
      />
    );
  }

  let appointment: AppoitmentWithRelations = apptRes.data;

  // 2) Authorization
  const session = await auth();
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
        title="Reservation expired"
        message="Please select a fresh time slot."
      />
    );
  }

  // A) 已经绑定用户的预约：必须 sessionUserId 匹配
  const isValidUser =
    sessionUserId !== null &&
    appointmentUserId !== null &&
    appointmentUserId === sessionUserId;

  // B) 还是 guest 的预约：URL guestIdentifier 必须匹配，且预约未绑定用户
  const isValidGuest =
    sessionUserId === null &&
    appointmentUserId === null &&
    typeof guestIdentifier === "string" &&
    guestIdentifier.length > 0 &&
    appointmentGuestIdentifier !== null &&
    guestIdentifier === appointmentGuestIdentifier;

  // C) “guest 已选槽位 → 登录后认领”：session 存在 + 预约未绑定用户 + URL guestIdentifier 匹配
  const shouldLinkGuestToUser =
    sessionUserId !== null &&
    appointmentUserId === null &&
    typeof guestIdentifier === "string" &&
    guestIdentifier.length > 0 &&
    appointmentGuestIdentifier !== null &&
    guestIdentifier === appointmentGuestIdentifier;

  if (!isValidUser && !isValidGuest && !shouldLinkGuestToUser) {
    return (
      <ErrorUI
        title="Not authorized"
        message="You do not have access to this reservation. Please select a slot again."
      />
    );
  }

  // 3) 如果是访客，更新预约以绑定用户
  if (shouldLinkGuestToUser && appointmentGuestIdentifier) {
    const linkRes = await updateGuestAppointmentWithUser(
      appointmentGuestIdentifier
    );

    if (!linkRes.success) {
      if (linkRes.errorType === "AUTHENTICATION_ERROR") {
        return (
          <ErrorUI
            title="Please sign in"
            message={linkRes.message ?? linkRes.error}
          />
        );
      }

      if (linkRes.errorType === "RESERVATION_EXPIRED") {
        return (
          <ErrorUI
            title="Reservation expired"
            message={
              linkRes.message ??
              "This reservation is no longer valid. Please select a slot again."
            }
          />
        );
      }

      return (
        <ErrorUI
          title="Unable to link reservation"
          message={linkRes.message ?? linkRes.error}
        />
      );
    }

    // Re-fetch appointment to get latest userId (no any)
    const apptRes2 = await getAppointmentData({ appointmentId });
    if (!apptRes2.success || !apptRes2.data) {
      return (
        <ErrorUI
          title="Unable to load reservation"
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
          title="Not authorized"
          message="This reservation could not be linked to your account. Please select a new slot."
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

  // 5) Convert UTC -> app timezone for appointment data
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
