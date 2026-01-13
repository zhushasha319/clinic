Prisma example with the Neon serverless driver
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL || "",{});
const prisma = new PrismaClient({ adapter });
export default prisma