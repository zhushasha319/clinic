import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient, Role } from "../lib/generated/prisma";
import dotenv from "dotenv";
import { hashSync } from "bcryptjs";

dotenv.config();

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL || "", {});
const prisma = new PrismaClient({ adapter });

// 新的中文医生数据
const newDoctors = [
  {
    name: "李明医生",
    email: "liming@clinic.com",
    specialty: "心脏科",
    brief: "拥有20年心脏病临床经验的资深专家，专注于心血管疾病的诊断和治疗。",
    credentials: "主任医师, 医学博士",
    languages: ["中文", "英文"],
    specializations: ["冠心病", "心律失常", "高血压"],
    image: "https://i.pravatar.cc/300?img=12",
  },
  {
    name: "王芳医生",
    email: "wangfang@clinic.com",
    specialty: "儿科",
    brief: "儿科专家，擅长儿童常见病及疑难杂症的诊治，深受家长信赖。",
    credentials: "副主任医师, 儿科学硕士",
    languages: ["中文", "英文"],
    specializations: ["儿童保健", "小儿呼吸", "预防接种"],
    image: "https://i.pravatar.cc/300?img=45",
  },
  {
    name: "张伟医生",
    email: "zhangwei@clinic.com",
    specialty: "骨科",
    brief: "骨科专家，在关节外科和运动医学领域有丰富经验。",
    credentials: "主任医师, 骨科学博士",
    languages: ["中文"],
    specializations: ["关节置换", "运动损伤", "骨折治疗"],
    image: "https://i.pravatar.cc/300?img=33",
  },
  {
    name: "刘静医生",
    email: "liujing@clinic.com",
    specialty: "皮肤科",
    brief: "皮肤科专家，擅长各类皮肤病的诊治及医学美容。",
    credentials: "副主任医师, 皮肤病学硕士",
    languages: ["中文", "英文"],
    specializations: ["痤疮治疗", "皮肤美容", "过敏性皮肤病"],
    image: "https://i.pravatar.cc/300?img=47",
  },
  {
    name: "陈浩医生",
    email: "chenhao@clinic.com",
    specialty: "神经科",
    brief: "神经科专家，专注于神经系统疾病的诊断和康复治疗。",
    credentials: "主任医师, 神经病学博士",
    languages: ["中文", "英文"],
    specializations: ["脑血管病", "神经康复", "头痛治疗"],
    image: "https://i.pravatar.cc/300?img=15",
  },
  {
    name: "赵敏医生",
    email: "zhaomin@clinic.com",
    specialty: "眼科",
    brief: "眼科专家，在白内障手术和眼底病治疗方面经验丰富。",
    credentials: "副主任医师, 眼科学硕士",
    languages: ["中文"],
    specializations: ["白内障手术", "眼底病", "青光眼"],
    image: "https://i.pravatar.cc/300?img=49",
  },
];

async function regenerateDoctors() {
  console.log("🔍 查找现有医生...");

  const existingDoctors = await prisma.user.findMany({
    where: { role: Role.DOCTOR },
    include: { doctorProfile: true },
  });

  console.log(`\n找到 ${existingDoctors.length} 个医生账户`);
  existingDoctors.forEach((d) => {
    console.log(`  - ${d.name} (${d.email})`);
  });

  // 删除测试医生 dr.test
  const testDoctor = existingDoctors.find((d) => d.email === "doctor@test.com");
  if (testDoctor) {
    console.log(`\n🗑️  删除测试医生: ${testDoctor.name} (${testDoctor.email})`);

    // 先删除医生的预约
    await prisma.appointment.deleteMany({
      where: { doctorId: testDoctor.id },
    });
    console.log("  ✅ 已删除相关预约");

    // 删除医生档案
    if (testDoctor.doctorProfile) {
      await prisma.doctorProfile.delete({
        where: { userId: testDoctor.id },
      });
      console.log("  ✅ 已删除医生档案");
    }

    // 删除用户
    await prisma.user.delete({
      where: { id: testDoctor.id },
    });
    console.log("  ✅ 已删除用户账户");
  }

  console.log("\n👨‍⚕️ 创建新的中文医生数据...\n");
  const hashed = hashSync("123456", 10);

  for (const doctor of newDoctors) {
    try {
      const user = await prisma.user.upsert({
        where: { email: doctor.email },
        update: {
          name: doctor.name,
          role: Role.DOCTOR,
          image: doctor.image,
        },
        create: {
          name: doctor.name,
          email: doctor.email,
          password: hashed,
          role: Role.DOCTOR,
          image: doctor.image,
        },
      });

      await prisma.doctorProfile.upsert({
        where: { userId: user.id },
        update: {
          specialty: doctor.specialty,
          brief: doctor.brief,
          credentials: doctor.credentials,
          languages: doctor.languages,
          specializations: doctor.specializations,
        },
        create: {
          userId: user.id,
          specialty: doctor.specialty,
          brief: doctor.brief,
          credentials: doctor.credentials,
          languages: doctor.languages,
          specializations: doctor.specializations,
        },
      });

      console.log(`✅ ${doctor.name} - ${doctor.specialty}`);
    } catch (error) {
      console.error(`❌ 创建 ${doctor.name} 失败:`, error);
    }
  }

  console.log("\n📋 当前所有医生:");
  const allDoctors = await prisma.user.findMany({
    where: { role: Role.DOCTOR },
    include: { doctorProfile: true },
  });

  allDoctors.forEach((d) => {
    console.log(
      `  - ${d.name} (${d.email}) - ${d.doctorProfile?.specialty || "无专业"}`,
    );
  });

  console.log(`\n✅ 完成！共有 ${allDoctors.length} 位医生`);
}

regenerateDoctors()
  .catch((error) => {
    console.error("❌ 操作失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
