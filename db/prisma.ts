import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaNeonHttp(databaseUrl, {});
  return new PrismaClient({ adapter });
}

// 使用 getter 实现延迟初始化，避免在构建时就创建连接
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// 使用 Proxy 实现延迟初始化
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return Reflect.get(client, prop);
  },
});

export default prisma;
