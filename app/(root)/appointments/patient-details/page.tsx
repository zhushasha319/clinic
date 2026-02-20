import PatientDetailsClient from "./patient-details-client";
import type {
  AppointmentData,
  AppoitmentWithRelations,
  PatientData,
} from "@/types";
import {
  getAppointmentData,
  updateGuestAppointmentWithUser,
} from "@/lib/actions/appointment/appointment.action";
import { getAppTimeZone } from "@/lib/config";
import { getGuestReservationCookieName } from "@/lib/appointment/guest-cookie";
import { auth } from "@/auth";
import prisma from "@/db/prisma";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { cookies } from "next/headers";
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

function buildPatientDetailsCallbackUrl({
  appointmentId,
  guestIdentifier,
}: {
  appointmentId: string;
  guestIdentifier?: string;
}) {
  const params = new URLSearchParams({ appointmentId });
  if (guestIdentifier) {
    params.set("guestIdentifier", guestIdentifier);
  }
  return `/appointments/patient-details?${params.toString()}`;
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
    return <ErrorUI title="缺少预约信息" message="需要提供 appointmentId。" />;
  }

  const session = await auth();
  const sessionUserId = getSessionUserId(session);
  const cookieStore = await cookies();
  const guestIdentifierFromCookie =
    cookieStore.get(getGuestReservationCookieName(appointmentId))?.value ?? null;
  const guestIdentifierFromQuery =
    typeof guestIdentifier === "string" && guestIdentifier.length > 0
      ? guestIdentifier
      : null;

  const apptRes = await getAppointmentData({ appointmentId });
  if (!apptRes.success || !apptRes.data) {
    if (apptRes.errorType === "STATUS_CONFLICT") {
      return (
        <ErrorUI title="预约状态冲突" message={apptRes.message ?? apptRes.error} />
      );
    }
    if (apptRes.errorType === "RESERVATION_EXPIRED") {
      return (
        <ErrorUI
          title="预约已过期"
          message={apptRes.message ?? "该预约已过期，请重新选择时段。"}
        />
      );
    }
    return <ErrorUI title="无法加载预约" message={apptRes.message ?? apptRes.error} />;
  }

  let appointment: AppoitmentWithRelations = apptRes.data;
  const appointmentUserId = appointment.userId;
  const appointmentGuestIdentifier = appointment.guestIdentifier;

  const isNotExpired =
    appointment.reservationExpiresAt !== null &&
    appointment.reservationExpiresAt > new Date();
  if (!isNotExpired) {
    return <ErrorUI title="预约已过期" message="请重新选择一个可用时段。" />;
  }

  const hasGuestIdentifierMatch =
    appointmentGuestIdentifier !== null &&
    ((typeof guestIdentifierFromCookie === "string" &&
      guestIdentifierFromCookie.length > 0 &&
      appointmentGuestIdentifier === guestIdentifierFromCookie) ||
      (typeof guestIdentifierFromQuery === "string" &&
        guestIdentifierFromQuery.length > 0 &&
        appointmentGuestIdentifier === guestIdentifierFromQuery));

  const isOwnerUser =
    sessionUserId !== null &&
    appointmentUserId !== null &&
    appointmentUserId === sessionUserId;

  const shouldLinkGuestToUser =
    sessionUserId !== null &&
    appointmentUserId === null &&
    hasGuestIdentifierMatch;


  if (sessionUserId === null) {
    const callbackUrl = buildPatientDetailsCallbackUrl({
      appointmentId,
      guestIdentifier:
        typeof guestIdentifierFromCookie === "string" &&
        guestIdentifierFromCookie.length > 0
          ? guestIdentifierFromCookie
          : undefined,
    });
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!isOwnerUser && !shouldLinkGuestToUser) {
    const message =
      appointmentUserId === null
        ? "访客预约校验失败（可能是预约凭证已失效或不匹配）。请返回医生页面重新选择时段。"
        : "你无权访问该预约，请重新选择时段。";
    return <ErrorUI title="无权访问" message={message} />;
  }

  if (shouldLinkGuestToUser && appointmentGuestIdentifier) {
    const linkRes = await updateGuestAppointmentWithUser(appointmentGuestIdentifier);
    if (!linkRes.success) {
      if (linkRes.errorType === "AUTHENTICATION_ERROR") {
        return <ErrorUI title="请先登录" message={linkRes.message ?? linkRes.error} />;
      }
      if (linkRes.errorType === "RESERVATION_EXPIRED") {
        return (
          <ErrorUI
            title="预约已过期"
            message={linkRes.message ?? "该预约已过期，请重新选择时段。"}
          />
        );
      }
      return <ErrorUI title="无法绑定预约" message={linkRes.message ?? linkRes.error} />;
    }

    const apptRes2 = await getAppointmentData({ appointmentId });
    if (!apptRes2.success || !apptRes2.data) {
      return <ErrorUI title="无法加载预约" message={apptRes2.message ?? apptRes2.error} />;
    }
    appointment = apptRes2.data;

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

  let patientDetailsForClient: PatientData = {
    name: appointment.patientName === "Guest" ? "" : (appointment.patientName ?? ""),
    email: "",
    phoneNumber: appointment.phoneNumber ?? "",
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

  const tz = getAppTimeZone();
  const startZoned = toZonedTime(appointment.appointmentStartUTC, tz);
  const endZoned = toZonedTime(appointment.appointmentEndUTC, tz);

  const dateStr = format(startZoned, "yyyy-MM-dd");
  const startTimeStr = format(startZoned, "HH:mm");
  const endTimeStr = format(endZoned, "HH:mm");

  const doctorName = appointment.doctor?.name ?? "Doctor";
  const doctorImage = appointment.doctor?.image ?? null;
  const doctorSpecilaity = appointment.doctor?.doctorProfile?.specialty ?? "";

  const appointmentDataForClient: AppointmentData = {
    appointmentId: appointment.appointmentId,
    doctorId: appointment.doctorId,
    doctorName,
    doctorSpecilaity,
    doctorImage,
    date: dateStr,
    timeSlot: startTimeStr,
    endTime: endTimeStr,
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
        isAuthenticated={sessionUserId !== null}
      />
    </div>
  );
}
