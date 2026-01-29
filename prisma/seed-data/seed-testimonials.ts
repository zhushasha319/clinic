import "dotenv/config";
import { Role, PatientType, AppointmentStatus } from "@/lib/generated/prisma";
import prisma from "@/db/prisma";
import { subDays } from "date-fns";

// 评论模板
const testimonialTemplates = [
  {
    rating: 5.0,
    text: "非常专业的医生，耐心解答了我所有的问题，让我对病情有了清晰的了解。强烈推荐！",
  },
  {
    rating: 4.8,
    text: "医术精湛，态度和蔼。整个就诊过程非常顺利，医生给出的治疗方案很有效。",
  },
  {
    rating: 4.5,
    text: "医生很细心，检查得很仔细。虽然等待时间稍长，但诊疗质量很高。",
  },
  {
    rating: 5.0,
    text: "这是我见过的最负责任的医生之一，不仅治好了我的病，还教会我如何预防。",
  },
  {
    rating: 4.7,
    text: "医生经验丰富，一眼就看出了问题所在。开的药也很对症，几天就好了。",
  },
  {
    rating: 4.9,
    text: "非常满意这次就诊体验。医生解释病情时用词通俗易懂，让人感觉很放心。",
  },
  {
    rating: 4.6,
    text: "专业水平很高，对待病人很耐心。环境也很舒适，下次还会来。",
  },
  {
    rating: 5.0,
    text: "医生非常认真负责，详细询问了我的症状和病史，诊断准确，治疗效果很好。",
  },
  {
    rating: 4.8,
    text: "服务态度很好，医生很有亲和力。看病过程中一直在安慰我的情绪，很贴心。",
  },
  {
    rating: 4.4,
    text: "整体体验不错，医生的建议很实用。唯一的小遗憾是预约等待时间有点长。",
  },
  {
    rating: 4.9,
    text: "医生技术精湛，问诊非常仔细。给我开的处方很有效，症状明显改善了。",
  },
  {
    rating: 4.7,
    text: "很专业的医生，对病情分析透彻。复诊时也很认真地跟进我的恢复情况。",
  },
  {
    rating: 5.0,
    text: "强烈推荐这位医生！不仅医术高超，还非常有耐心，让人感觉很温暖。",
  },
  {
    rating: 4.5,
    text: "医生的诊断很准确，治疗方案也很合理。感谢医生的精心治疗！",
  },
  {
    rating: 4.8,
    text: "这位医生非常专业，对患者很关心。整个就诊过程让我感到很安心。",
  },
];

// 患者姓名列表
const patientNames = [
  "张明",
  "李华",
  "王芳",
  "刘强",
  "陈静",
  "杨洋",
  "赵敏",
  "周杰",
  "吴丽",
  "郑伟",
  "孙婷",
  "朱军",
  "马超",
  "胡敏",
  "林涛",
];

async function seedTestimonials() {
  console.log("开始为每个医生创建10条评论...");

  // 获取所有有 DoctorProfile 的医生
  const doctors = await prisma.user.findMany({
    where: {
      role: Role.DOCTOR,
      doctorProfile: { isNot: null },
    },
    include: { doctorProfile: true },
  });

  if (doctors.length === 0) {
    console.log("没有找到医生，请先创建医生数据。");
    return;
  }

  console.log(`找到 ${doctors.length} 位医生（有 DoctorProfile）`);

  // 创建或获取一些患者用户
  const patients: { id: string; name: string }[] = [];

  for (let i = 0; i < patientNames.length; i++) {
    const email = `patient${i + 1}@testimonial.test`;
    const patient = await prisma.user.upsert({
      where: { email },
      update: { name: patientNames[i] },
      create: {
        name: patientNames[i],
        email,
        role: Role.PATIENT,
        image: `https://i.pravatar.cc/150?img=${i + 20}`,
      },
    });
    patients.push({ id: patient.id, name: patient.name });
  }

  console.log(`准备了 ${patients.length} 位患者用户`);

  const now = new Date();
  let totalCreated = 0;

  for (const doctor of doctors) {
    console.log(`正在为医生 ${doctor.name} 创建评论...`);

    // 为每个医生创建10条评论
    for (let i = 0; i < 10; i++) {
      const patient = patients[i % patients.length];
      const template = testimonialTemplates[i % testimonialTemplates.length];

      // 创建过去的预约日期（30-60天前）
      const daysAgo = 30 + Math.floor(Math.random() * 30);
      const appointmentDate = subDays(now, daysAgo);
      appointmentDate.setHours(9 + (i % 8), 0, 0, 0);

      const endDate = new Date(appointmentDate);
      endDate.setMinutes(endDate.getMinutes() + 30);

      try {
        // 创建已完成的预约
        const appointment = await prisma.appointment.create({
          data: {
            doctorId: doctor.id,
            userId: patient.id,
            patientType: PatientType.MYSELF,
            patientName: patient.name,
            phoneNumber: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
            appointmentStartUTC: appointmentDate,
            appointmentEndUTC: endDate,
            status: AppointmentStatus.COMPLETED,
            reasonForVisit: "常规检查",
            additionalNotes: "seed:testimonial",
            paidAt: appointmentDate,
          },
        });

        // 创建评论
        await prisma.doctorTestimonial.create({
          data: {
            appointmentId: appointment.appointmentId,
            doctorId: doctor.id,
            patientId: patient.id,
            testimonialText: template.text,
            rating: template.rating,
          },
        });

        totalCreated++;
      } catch (error) {
        console.error(`创建评论失败:`, error);
      }
    }

    // 更新医生的评分和评论数
    const testimonials = await prisma.doctorTestimonial.findMany({
      where: { doctorId: doctor.id },
      select: { rating: true },
    });

    const reviewCount = testimonials.length;
    const avgRating =
      reviewCount > 0
        ? testimonials.reduce((sum, t) => sum + (t.rating ?? 0), 0) /
          reviewCount
        : 0;

    await prisma.doctorProfile.update({
      where: { userId: doctor.id },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount,
      },
    });

    console.log(
      `  ✓ 医生 ${doctor.name}: ${reviewCount} 条评论, 平均评分 ${avgRating.toFixed(1)}`,
    );
  }

  console.log(`\n完成！共创建 ${totalCreated} 条评论。`);
}

seedTestimonials()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
