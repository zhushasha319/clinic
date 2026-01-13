// Prisma example with the Neon serverless driver
import { neon } from '@neondatabase/serverless';
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
const sql = neon(process.env.DATABASE_URL);
const adapter = new PrismaNeonHttp(sql);
const prisma = new PrismaClient({ adapter });