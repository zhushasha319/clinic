


import "dotenv/config";
import {
  LeaveType,
  Role,
  PatientType,
  AppointmentStatus,
} from "@/lib/generated/prisma";
import prisma from "@/db/prisma";

async function main() {
  // --- Placeholder for Doctor IDs ---
  const doctorIds = [
    "6a4b9034-4b75-4720-8453-d5e6e382fcfc", // Replace with actual doctor ID
    "672edc4a-62cd-4e99-aa95-ae2631b8c9e2", // Replace with actual doctor ID
    "d2d15e25-f047-4cc2-8fb6-65c70acd60c8", // Replace with actual doctor ID
  ];

  const doctors = [
    {
      id: doctorIds[0],
      name: "Dr. Li Wei",
      email: "li.wei@clinic.test",
      image: "https://i.pravatar.cc/150?img=11",
      specialty: "Cardiology",
      credentials: "MD, FACC",
      brief: "Experienced cardiologist focused on preventive care.",
      languages: ["Chinese", "English"],
      specializations: ["Heart Failure", "Hypertension"],
    },
    {
      id: doctorIds[1],
      name: "Dr. Chen Yu",
      email: "chen.yu@clinic.test",
      image: "https://i.pravatar.cc/150?img=32",
      specialty: "Dermatology",
      credentials: "MD, FAAD",
      brief: "Dermatologist specializing in clinical and cosmetic care.",
      languages: ["Chinese", "English"],
      specializations: ["Acne", "Skin Allergies"],
    },
    {
      id: doctorIds[2],
      name: "Dr. Wang Lin",
      email: "wang.lin@clinic.test",
      image: "https://i.pravatar.cc/150?img=44",
      specialty: "Pediatrics",
      credentials: "MD, FAAP",
      brief: "Pediatrician with a focus on child wellness and development.",
      languages: ["Chinese", "English"],
      specializations: ["Child Nutrition", "Immunization"],
    },
  ];

  const patients = [
    {
      id: "0b2e91d1-3f2b-4b1f-9c89-4f3d6b2c32a1",
      name: "Zhang Min",
      email: "zhang.min@patient.test",
      image: "https://i.pravatar.cc/150?img=5",
    },
    {
      id: "a31b2fe7-2a65-4b8c-9a7e-6bfa4a4f1f5a",
      name: "Liu Fang",
      email: "liu.fang@patient.test",
      image: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: "6fd6b1e6-5fd5-4b9b-9b3a-65c5f3f5e9a2",
      name: "He Qiang",
      email: "he.qiang@patient.test",
      image: "https://i.pravatar.cc/150?img=21",
    },
  ];

  console.log("Seeding doctors, patients, and testimonials...");

  for (const doctor of doctors) {
    await prisma.user.upsert({
      where: { id: doctor.id },
      update: {
        name: doctor.name,
        email: doctor.email,
        role: Role.DOCTOR,
        image: doctor.image,
      },
      create: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        role: Role.DOCTOR,
        image: doctor.image,
      },
    });

    await prisma.doctorProfile.upsert({
      where: { userId: doctor.id },
      update: {
        specialty: doctor.specialty,
        brief: doctor.brief,
        credentials: doctor.credentials,
        languages: doctor.languages,
        specializations: doctor.specializations,
        isActive: true,
      },
      create: {
        userId: doctor.id,
        specialty: doctor.specialty,
        brief: doctor.brief,
        credentials: doctor.credentials,
        languages: doctor.languages,
        specializations: doctor.specializations,
        isActive: true,
      },
    });
  }

  for (const patient of patients) {
    await prisma.user.upsert({
      where: { id: patient.id },
      update: {
        name: patient.name,
        email: patient.email,
        role: Role.PATIENT,
        image: patient.image,
      },
      create: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        role: Role.PATIENT,
        image: patient.image,
      },
    });
  }

  const testimonials = [
    {
      appointmentId: "2d5e9d3d-1c0f-4ac9-9db9-0f0f2d2c9b01",
      doctorId: doctorIds[0],
      patientId: patients[0].id,
      rating: 4.8,
      testimonialText: "Very attentive and thorough consultation.",
      startUTC: new Date("2026-01-16T06:00:00Z"),
      endUTC: new Date("2026-01-16T06:30:00Z"),
    },
    {
      appointmentId: "b7a1b1e1-6a1b-4c7d-8e1a-9a8c1b2d3e4f",
      doctorId: doctorIds[1],
      patientId: patients[1].id,
      rating: 4.5,
      testimonialText: "Clear explanations and helpful treatment plan.",
      startUTC: new Date("2026-01-16T07:00:00Z"),
      endUTC: new Date("2026-01-16T07:30:00Z"),
    },
    {
      appointmentId: "9f4c2a11-7c1d-4f8b-9c2a-1d9e2b7c4f55",
      doctorId: doctorIds[2],
      patientId: patients[2].id,
      rating: 5,
      testimonialText: "Great with kids and very patient.",
      startUTC: new Date("2026-01-16T08:00:00Z"),
      endUTC: new Date("2026-01-16T08:30:00Z"),
    },
    {
      appointmentId: "c5d7a6b2-9e42-4f0b-8d88-3b0b9c1a2d3e",
      doctorId: doctorIds[0],
      patientId: patients[1].id,
      rating: 4.2,
      testimonialText: "Professional and friendly service.",
      startUTC: new Date("2026-01-16T09:00:00Z"),
      endUTC: new Date("2026-01-16T09:30:00Z"),
    },
  ];

  for (const item of testimonials) {
    await prisma.appointment.upsert({
      where: { appointmentId: item.appointmentId },
      update: {
        doctorId: item.doctorId,
        userId: item.patientId,
        patientType: PatientType.MYSELF,
        patientName:
          patients.find((p) => p.id === item.patientId)?.name || "Patient",
        appointmentStartUTC: item.startUTC,
        appointmentEndUTC: item.endUTC,
        status: AppointmentStatus.COMPLETED,
      },
      create: {
        appointmentId: item.appointmentId,
        doctorId: item.doctorId,
        userId: item.patientId,
        patientType: PatientType.MYSELF,
        patientName:
          patients.find((p) => p.id === item.patientId)?.name || "Patient",
        appointmentStartUTC: item.startUTC,
        appointmentEndUTC: item.endUTC,
        status: AppointmentStatus.COMPLETED,
      },
    });

    await prisma.doctorTestimonial.upsert({
      where: { appointmentId: item.appointmentId },
      update: {
        doctorId: item.doctorId,
        patientId: item.patientId,
        testimonialText: item.testimonialText,
        rating: item.rating,
      },
      create: {
        appointmentId: item.appointmentId,
        doctorId: item.doctorId,
        patientId: item.patientId,
        testimonialText: item.testimonialText,
        rating: item.rating,
      },
    });
  }

  const ratingMap = new Map<string, { total: number; count: number }>();
  for (const item of testimonials) {
    const entry = ratingMap.get(item.doctorId) || { total: 0, count: 0 };
    entry.total += item.rating;
    entry.count += 1;
    ratingMap.set(item.doctorId, entry);
  }

  for (const [doctorId, stats] of ratingMap.entries()) {
    await prisma.doctorProfile.update({
      where: { userId: doctorId },
      data: {
        rating: Number((stats.total / stats.count).toFixed(2)),
        reviewCount: stats.count,
      },
    });
  }

  console.log("Doctor, patient, and testimonial seeding finished.");

  // --- Leave Dates ---
  // Note: The database enforces a unique constraint on (doctorId, leaveDate).
  // We use upsert to avoid duplicate key errors when re-running the seed.
  const leaveDate = new Date("2026-01-17T00:00:00Z");

  console.log("Setting leave for doctors...");

  // --- Set FULL_DAY Leave ---
  await prisma.doctorLeave.upsert({
    where: {
      doctorId_leaveDate: {
        doctorId: doctorIds[0],
        leaveDate: leaveDate,
      },
    },
    update: {
      leaveType: LeaveType.FULL_DAY,
      reason: "Personal leave",
    },
    create: {
      doctorId: doctorIds[0],
      leaveDate: leaveDate,
      leaveType: LeaveType.FULL_DAY,
      reason: "Personal leave",
    },
  });
  console.log(
    `Set FULL_DAY leave for doctor ${
      doctorIds[0]
    } on ${leaveDate.toDateString()}`
  );

  // --- Set MORNING Leave ---
  await prisma.doctorLeave.upsert({
    where: {
      doctorId_leaveDate: {
        doctorId: doctorIds[1],
        leaveDate: leaveDate,
      },
    },
    update: {
      leaveType: LeaveType.MORNING,
      reason: "Personal leave",
    },
    create: {
      doctorId: doctorIds[1],
      leaveDate: leaveDate,
      leaveType: LeaveType.MORNING,
      reason: "Personal leave",
    },
  });
  console.log(
    `Set MORNING leave for doctor ${
      doctorIds[1]
    } on ${leaveDate.toDateString()}`
  );

  // --- Set AFTERNOON Leave ---
  await prisma.doctorLeave.upsert({
    where: {
      doctorId_leaveDate: {
        doctorId: doctorIds[2],
        leaveDate: leaveDate,
      },
    },
    update: {
      leaveType: LeaveType.AFTERNOON,
      reason: "Personal leave",
    },
    create: {
      doctorId: doctorIds[2],
      leaveDate: leaveDate,
      leaveType: LeaveType.AFTERNOON,
      reason: "Personal leave",
    },
  });
  console.log(
    `Set AFTERNOON leave for doctor ${
      doctorIds[2]
    } on ${leaveDate.toDateString()}`
  );

  console.log("Leave setting finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
