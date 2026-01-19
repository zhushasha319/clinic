import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient,Role,AppointmentStatus,PatientType } from "../lib/generated/prisma";
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

  await prisma.user.upsert({
    where: { email: "patient@test.com" },
    update: { name: "Patient User", role: Role.PATIENT },
    create: {
      name: "Patient User",
      email: "patient@test.com",
      password: hashed,
      role: Role.PATIENT,
    },
  });

  console.log("✅ Seed done safely (no overwrite)");
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
