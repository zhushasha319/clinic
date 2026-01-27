import prisma from "@/db/prisma";
import DoctorLeaveClient from "./DoctorLeaveClient";
import { getDoctorLeaveMonth } from "@/lib/actions/admin/doctor-leave.actions";

export default async function DoctorLeavePage({
  params,
}: {
  params: Promise<{ doctorId: string }>; 
}) {
  const { doctorId } = await params;
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { doctorProfile: true },
  });

  if (!doctor) {
    return <div className="p-6 text-sm text-muted-foreground">不存在该医生</div>;
  }

  const now = new Date();
  const initialMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const data = await getDoctorLeaveMonth({
    doctorId,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  return (
    <DoctorLeaveClient
      doctorId={doctorId}
      doctorName={doctor.name ?? "医生"}
      initialMonth={initialMonth}
      initialLeaves={data.leaves}
      initialBlockedDates={data.blockedDates}
    />
  );
}
