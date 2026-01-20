import { PrismaNeonHttp } from "@prisma/adapter-neon";
import {
  PrismaClient,
  Role,
  AppointmentStatus,
  PatientType,
} from "../lib/generated/prisma";
import dotenv from "dotenv";
import { hashSync } from "bcryptjs";
dotenv.config();

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL || "", {});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = hashSync("123", 10);

  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: { name: "Admin User", role: Role.ADMIN },
    create: {
      name: "Admin User",
      email: "admin@test.com",
      password: hashed,
      role: Role.ADMIN,
    },
  });

  const patient = await prisma.user.upsert({
    where: { email: "patient@test.com" },
    update: { name: "Patient User", role: Role.PATIENT },
    create: {
      name: "Patient User",
      email: "patient@test.com",
      password: hashed,
      role: Role.PATIENT,
    },
  });

  // 创建测试医生
  const doctor = await prisma.user.upsert({
    where: { email: "doctor@test.com" },
    update: { name: "Dr. Test", role: Role.DOCTOR },
    create: {
      name: "Dr. Test",
      email: "doctor@test.com",
      password: hashed,
      role: Role.DOCTOR,
    },
  });

  // 创建医生档案
  await prisma.doctorProfile.upsert({
    where: { userId: doctor.id },
    update: {
      specialty: "General Practice",
      brief: "Experienced practitioner",
      credentials: "MD, MBBS",
    },
    create: {
      userId: doctor.id,
      specialty: "General Practice",
      brief: "Experienced general practitioner with 10 years of practice",
      credentials: "MD, MBBS",
      languages: ["English", "Chinese"],
      specializations: ["General Medicine", "Preventive Care"],
    },
  });

  // 创建 5 个预约，覆盖所有状态（除 PAYMENT_PENDING）
  const now = new Date();
  const appointmentStatuses = [
    {
      status: AppointmentStatus.BOOKING_CONFIRMED,
      days: 7,
      reason: "Regular checkup - Upcoming",
    },
    {
      status: AppointmentStatus.COMPLETED,
      days: -7,
      reason: "Follow-up consultation - Completed",
    },
    {
      status: AppointmentStatus.CANCELLED,
      days: 3,
      reason: "Initial consultation - Cancelled",
    },
    {
      status: AppointmentStatus.NO_SHOW,
      days: -3,
      reason: "Vaccination appointment - No Show",
    },
    {
      status: AppointmentStatus.CASH,
      days: 14,
      reason: "Health screening - Cash Payment",
    },
  ];

  for (const apt of appointmentStatuses) {
    const appointmentDate = new Date(now);
    appointmentDate.setDate(appointmentDate.getDate() + apt.days);
    appointmentDate.setHours(10, 0, 0, 0);

    const endDate = new Date(appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    await prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        userId: patient.id,
        patientType: PatientType.MYSELF,
        patientName: patient.name || "Patient User",
        phoneNumber: "1234567890",
        appointmentStartUTC: appointmentDate,
        appointmentEndUTC: endDate,
        status: apt.status,
        reasonForVisit: apt.reason,
        additionalNotes: `Test appointment with status: ${apt.status}`,
        paidAt:
          apt.status === AppointmentStatus.COMPLETED ||
          apt.status === AppointmentStatus.CASH
            ? appointmentDate
            : null,
      },
    });
  }

  console.log("✅ Seed done safely - created patient with 5 appointments");
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
