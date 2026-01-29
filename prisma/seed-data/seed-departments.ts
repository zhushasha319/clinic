import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "../../lib/generated/prisma";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL || "", {});
const prisma = new PrismaClient({ adapter });

// 中文部门数据
const departments = [
  { name: "心脏科", iconName: "Heart" },
  { name: "神经科", iconName: "Brain" },
  { name: "儿科", iconName: "Baby" },
  { name: "骨科", iconName: "Bone" },
  { name: "皮肤科", iconName: "Sparkles" },
  { name: "眼科", iconName: "Eye" },
];

async function seedDepartments() {
  console.log("🌱 开始插入部门数据...");

  for (const dept of departments) {
    try {
      const department = await prisma.department.upsert({
        where: { name: dept.name },
        update: { iconName: dept.iconName },
        create: {
          name: dept.name,
          iconName: dept.iconName,
        },
      });
      console.log(`✅ 已插入/更新部门: ${department.name}`);
    } catch (error) {
      console.error(`❌ 插入部门 ${dept.name} 失败:`, error);
    }
  }

  console.log("✅ 部门数据插入完成");
}

seedDepartments()
  .catch((error) => {
    console.error("❌ 种子数据插入失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
