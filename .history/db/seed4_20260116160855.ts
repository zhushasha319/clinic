import "dotenv/config";
import { LeaveType } from "@/lib/generated/prisma";
import prisma from "@/db/prisma";

async function main() {
  // --- Placeholder for Doctor IDs ---
  const doctorIds = [
    "6a4b9034-4b75-4720-8453-d5e6e382fcfc", // Replace with actual doctor ID
    "672edc4a-62cd-4e99-aa95-ae2631b8c9e2", // Replace with actual doctor ID
    "d2d15e25-f047-4cc2-8fb6-65c70acd60c8", // Replace with actual doctor ID
  ];

  // --- Leave Dates ---
  // Note: The script will create overlapping leave requests for the same day
  // for each doctor for demonstration purposes. In a real-world scenario,
  // you would likely only create one leave type per doctor per day.
  const leaveDate = new Date("2026-01-17T00:00:00Z");

  console.log("Setting leave for doctors...");

  // --- Set FULL_DAY Leave ---
  await prisma.doctorLeave.create({
    data: {
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
  await prisma.doctorLeave.create({
    data: {
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
  await prisma.doctorLeave.create({
    data: {
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
