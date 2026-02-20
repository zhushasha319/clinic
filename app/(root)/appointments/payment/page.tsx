import PaymentDetailsClient from "./payment-detail-client";
import { getAppTimeZone } from "@/lib/config";
import { auth } from "@/auth";
import prisma from "@/db/prisma";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateGuestAppointmentWithUser } from "@/lib/actions/appointment/appointment.action";
import { getGuestReservationCookieName } from "@/lib/appointment/guest-cookie";

interface PaymentDetailsSearchParams {
  appointmentId: string;
}

const buildPaymentUrl = (appointmentId: string) => {
  const params = new URLSearchParams({ appointmentId });
  return `/appointments/payment?${params.toString()}`;
};

const buildPatientDetailsUrl = (appointmentId: string) => {
  const params = new URLSearchParams({ appointmentId });
  return `/appointments/patient-details?${params.toString()}`;
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<PaymentDetailsSearchParams>;
}) {
  const { appointmentId } = await searchParams;

  if (!appointmentId) {
    redirect("/");
  }

  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = buildPaymentUrl(appointmentId);
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const cookieStore = await cookies();
  const guestIdentifierFromCookie =
    cookieStore.get(getGuestReservationCookieName(appointmentId))?.value ?? null;

  const getAppointment = async () => {
    return prisma.appointment.findUnique({
      where: { appointmentId },
      include: {
        doctor: {
          include: {
            doctorProfile: true,
          },
        },
      },
    });
  };

  let appointment = await getAppointment();
  if (!appointment) {
    redirect("/");
  }

  if (
    appointment.userId === null &&
    typeof guestIdentifierFromCookie === "string" &&
    guestIdentifierFromCookie.length > 0 &&
    appointment.guestIdentifier === guestIdentifierFromCookie
  ) {
    const linkRes = await updateGuestAppointmentWithUser(guestIdentifierFromCookie);
    if (!linkRes.success) {
      redirect(buildPatientDetailsUrl(appointmentId));
    }

    appointment = await getAppointment();
    if (!appointment) {
      redirect("/");
    }
  }

  if (appointment.userId !== session.user.id) {
    redirect(buildPatientDetailsUrl(appointmentId));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phoneNumber: true,
      dateofbirth: true,
    },
  });
  if (!user) {
    redirect("/sign-in");
  }

  // 绑定后若为“本人就诊”，以当前账号资料为准，避免访客填写与账号不一致。
  if (appointment.patientType === "MYSELF") {
    const currentDob = appointment.patientdateofbirth?.getTime() ?? null;
    const profileDob = user.dateofbirth?.getTime() ?? null;
    const shouldSyncMyselfInfo =
      appointment.patientName !== user.name ||
      appointment.phoneNumber !== (user.phoneNumber ?? null) ||
      currentDob !== profileDob;

    if (shouldSyncMyselfInfo) {
      await prisma.appointment.update({
        where: { appointmentId: appointment.appointmentId },
        data: {
          patientName: user.name,
          phoneNumber: user.phoneNumber ?? null,
          patientdateofbirth: user.dateofbirth ?? null,
        },
      });

      appointment = {
        ...appointment,
        patientName: user.name,
        phoneNumber: user.phoneNumber ?? null,
        patientdateofbirth: user.dateofbirth ?? null,
      };
    }
  }

  const tz = getAppTimeZone();
  const startZoned = toZonedTime(appointment.appointmentStartUTC, tz);
  const endZoned = toZonedTime(appointment.appointmentEndUTC, tz);

  const appointmentDataForClient = {
    appointmentId: appointment.appointmentId,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctor?.name ?? "Doctor",
    doctorSpecilaity: appointment.doctor?.doctorProfile?.specialty ?? "",
    doctorImage: appointment.doctor?.image ?? null,
    date: format(startZoned, "yyyy-MM-dd"),
    timeSlot: format(startZoned, "HH:mm"),
    endTime: format(endZoned, "HH:mm"),
    patientType: appointment.patientType,
    patientName: appointment.patientName ?? undefined,
    patientdateofbirth: appointment.patientdateofbirth ?? null,
    phoneNumber: appointment.phoneNumber ?? null,
    reasonForVisit: appointment.reasonForVisit ?? null,
    additionalNotes: appointment.additionalNotes ?? null,
    relationship: appointment.patientRelation ?? null,
    fee: 10,
    patientEmail: user?.email ?? "",
    userId: session.user.id,
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PaymentDetailsClient initialAppointmentData={appointmentDataForClient} />
    </div>
  );
}
