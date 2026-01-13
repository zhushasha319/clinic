import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma";
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL || "", {});
const prisma = new PrismaClient({ adapter });
export default prisma;
