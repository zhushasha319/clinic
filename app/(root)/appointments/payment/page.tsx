import PaymentDetailsClient from "./payment-detail-client";
import { getAppTimeZone } from "@/lib/config";
import { auth } from "@/auth";
import prisma from "@/db/prisma";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { updateGuestAppointmentWithUser } from "@/lib/actions/appointment/appointment.action";

interface PaymentDetailsSearchParams {
  appointmentId: string;
  guestIdentifier?: string;
}

const buildPaymentUrl = ({
  appointmentId,
  guestIdentifier,
}: {
  appointmentId: string;
  guestIdentifier?: string;
}) => {
  const params = new URLSearchParams({ appointmentId });
  if (guestIdentifier) {
    params.set("guestIdentifier", guestIdentifier);
  }
  return `/appointments/payment?${params.toString()}`;
};

const buildPatientDetailsUrl = ({
  appointmentId,
  guestIdentifier,
}: {
  appointmentId: string;
  guestIdentifier?: string;
}) => {
  const params = new URLSearchParams({ appointmentId });
  if (guestIdentifier) {
    params.set("guestIdentifier", guestIdentifier);
  }
  return `/appointments/patient-details?${params.toString()}`;
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<PaymentDetailsSearchParams>;
}) {
  const { appointmentId, guestIdentifier } = await searchParams;

  if (!appointmentId) {
    redirect("/");
  }

  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = buildPaymentUrl({ appointmentId, guestIdentifier });
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

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

  // 访客在支付前登录：根据 guestIdentifier 绑定到当前账号。
  if (
    appointment.userId === null &&
    typeof guestIdentifier === "string" &&
    guestIdentifier.length > 0 &&
    appointment.guestIdentifier === guestIdentifier
  ) {
    const linkRes = await updateGuestAppointmentWithUser(guestIdentifier);
    if (!linkRes.success) {
      redirect(buildPatientDetailsUrl({ appointmentId, guestIdentifier }));
    }

    appointment = await getAppointment();
    if (!appointment) {
      redirect("/");
    }
  }

  // 只有预约归属人可以进入支付页。
  if (appointment.userId !== session.user.id) {
    redirect(buildPatientDetailsUrl({ appointmentId, guestIdentifier }));
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
