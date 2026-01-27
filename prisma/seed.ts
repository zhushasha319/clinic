import { PrismaNeonHttp } from "@prisma/adapter-neon";
import {
  PrismaClient,
  Role,
  AppointmentStatus,
  PatientType,
  TransactionStatus,
} from "../lib/generated/prisma";
import dotenv from "dotenv";
import { hashSync } from "bcryptjs";
import { subDays } from "date-fns";

dotenv.config();

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL || "", {});
const prisma = new PrismaClient({ adapter });

const specialties = [
  {
    name: "General Medicine",
    email: "general-doctor@test.com",
    credentials: "MD",
  },
  {
    name: "Cardiology",
    email: "cardiology-doctor@test.com",
    credentials: "MD, Cardiology",
  },
  {
    name: "Pediatrics",
    email: "pediatrics-doctor@test.com",
    credentials: "MD, Pediatrics",
  },
  {
    name: "Orthopedics",
    email: "orthopedics-doctor@test.com",
    credentials: "MD, Orthopedics",
  },
];

const patientNames = [
  "Michael Brown",
  "Emma Davis",
  "Sophie Wilson",
  "William Taylor",
  "Olivia Martin",
  "Lucas Scott",
  "Ava Johnson",
  "Ethan White",
];

async function seedDashboardData() {
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

  await prisma.department.upsert({
    where: { name: "General Medicine" },
    update: { iconName: "Stethoscope" },
    create: { name: "General Medicine", iconName: "Stethoscope" },
  });
  await prisma.department.upsert({
    where: { name: "Cardiology" },
    update: { iconName: "HeartPulse" },
    create: { name: "Cardiology", iconName: "HeartPulse" },
  });
  await prisma.department.upsert({
    where: { name: "Pediatrics" },
    update: { iconName: "Baby" },
    create: { name: "Pediatrics", iconName: "Baby" },
  });
  await prisma.department.upsert({
    where: { name: "Orthopedics" },
    update: { iconName: "Bone" },
    create: { name: "Orthopedics", iconName: "Bone" },
  });

  await prisma.appointment.deleteMany({
    where: {
      additionalNotes: {
        contains: "seed:dashboard",
      },
    },
  });

  const doctors = [] as { id: string; name: string; specialty: string }[];

  for (const [index, specialty] of specialties.entries()) {
    const doctor = await prisma.user.upsert({
      where: { email: specialty.email },
      update: { name: `Dr. ${specialty.name}`, role: Role.DOCTOR },
      create: {
        name: `Dr. ${specialty.name}`,
        email: specialty.email,
        password: hashed,
        role: Role.DOCTOR,
      },
    });

    await prisma.doctorProfile.upsert({
      where: { userId: doctor.id },
      update: {
        specialty: specialty.name,
        brief: "Experienced doctor in the clinic",
        credentials: specialty.credentials,
        languages: ["English"],
        specializations: [specialty.name],
      },
      create: {
        userId: doctor.id,
        specialty: specialty.name,
        brief: "Experienced doctor in the clinic",
        credentials: specialty.credentials,
        languages: ["English"],
        specializations: [specialty.name],
      },
    });

    doctors.push({ id: doctor.id, name: doctor.name, specialty: specialty.name });

    if (index === 0) {
      await prisma.user.upsert({
        where: { email: "doctor@test.com" },
        update: { name: "Dr. Test", role: Role.DOCTOR },
        create: {
          name: "Dr. Test",
          email: "doctor@test.com",
          password: hashed,
          role: Role.DOCTOR,
        },
      });
    }
  }

  const now = new Date();
  let appointmentIndex = 0;

  for (const doctor of doctors) {
    for (let i = 0; i < 8; i += 1) {
      const dayOffset = (appointmentIndex * 2 + i) % 28;
      const appointmentDate = subDays(now, dayOffset);
      appointmentDate.setHours(9 + (i % 5), 0, 0, 0);

      const endDate = new Date(appointmentDate);
      endDate.setMinutes(endDate.getMinutes() + 30);

      const status =
        i % 4 === 0
          ? AppointmentStatus.COMPLETED
          : i % 4 === 1
            ? AppointmentStatus.BOOKING_CONFIRMED
            : i % 4 === 2
              ? AppointmentStatus.CANCELLED
              : AppointmentStatus.CASH;

      const appointment = await prisma.appointment.create({
        data: {
          doctorId: doctor.id,
          userId: patient.id,
          patientType: PatientType.MYSELF,
          patientName: patientNames[appointmentIndex % patientNames.length],
          phoneNumber: "1234567890",
          appointmentStartUTC: appointmentDate,
          appointmentEndUTC: endDate,
          status,
          reasonForVisit: "Routine checkup",
          additionalNotes: "seed:dashboard",
          paidAt:
            status === AppointmentStatus.COMPLETED || status === AppointmentStatus.CASH
              ? appointmentDate
              : null,
        },
      });

      if (status === AppointmentStatus.COMPLETED) {
        const amount = 120 + (appointmentIndex % 5) * 60;
        const gatewayId = `seed-${appointment.appointmentId}`;

        await prisma.transaction.upsert({
          where: { gatewayTransactionId: gatewayId },
          update: {
            amount,
            status: TransactionStatus.COMPLETED,
            transactionDate: appointmentDate,
            notes: "seed:dashboard",
          },
          create: {
            appointmentId: appointment.appointmentId,
            doctorId: doctor.id,
            paymentGateway: "STRIPE",
            gatewayTransactionId: gatewayId,
            amount,
            currency: "USD",
            status: TransactionStatus.COMPLETED,
            transactionDate: appointmentDate,
            notes: "seed:dashboard",
          },
        });
      }

      appointmentIndex += 1;
    }
  }

  console.log("Seed done: dashboard data created.");
}

seedDashboardData()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
