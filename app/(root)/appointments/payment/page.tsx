import PaymentDetailsClient from "./payment-detail-client";
import { getAppTimeZone } from "@/lib/config";
import { auth } from "@/auth";
import prisma from "@/db/prisma";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { redirect } from "next/navigation";

interface PaymentDetailsSearchParams {
  appointmentId: string;
}

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
    redirect("/sign-in");
  }

  // 获取预约信息
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
    redirect("/");
  }

  // 获取用户信息
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

  // 格式化预约信息
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
    userId: session.user.id, // 添加用户ID
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PaymentDetailsClient initialAppointmentData={appointmentDataForClient} />
    </div>
  );
}
