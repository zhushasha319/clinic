import { PrismaClient } from "@prisma/client";
import prisma from "@/db/prisma";
import {
  users,
  departments,
  bannerImages,
  appSettings,
  workingDays,
} from "../db/dummydata2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // =========================================================================
    // 1. SEED APP SETTINGS
    // =========================================================================
    console.log("📋 Seeding App Settings...");
    await prisma.appSettings.upsert({
      where: { id: appSettings.id },
      update: appSettings,
      create: appSettings,
    });
    console.log("✅ App Settings seeded successfully");

    // =========================================================================
    // 2. SEED WORKING DAYS
    // =========================================================================
    console.log("📅 Seeding Working Days...");
    for (const day of workingDays) {
      await prisma.workingDay.upsert({
        where: {
          dayId: `day-${day.dayOfWeek}`, // Using a predictable ID for upsert
        },
        update: {
          dayOfWeek: day.dayOfWeek,
          isWorkingDay: day.isWorkingDay,
        },
        create: {
          dayId: `day-${day.dayOfWeek}`,
          dayOfWeek: day.dayOfWeek,
          isWorkingDay: day.isWorkingDay,
        },
      });
    }
    console.log(`✅ ${workingDays.length} Working Days seeded successfully`);

    // =========================================================================
    // 3. SEED DEPARTMENTS
    // =========================================================================
    console.log("🏥 Seeding Departments...");
    for (const dept of departments) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: { iconName: dept.iconName },
        create: {
          name: dept.name,
          iconName: dept.iconName,
        },
      });
    }
    console.log(`✅ ${departments.length} Departments seeded successfully`);

    // =========================================================================
    // 4. SEED BANNER IMAGES
    // =========================================================================
    console.log("🖼️  Seeding Banner Images...");
    for (const banner of bannerImages) {
      await prisma.bannerImage.upsert({
        where: { name: banner.name },
        update: {
          imageUrl: banner.imageUrl,
          fileKey: banner.fileKey,
          order: banner.order,
        },
        create: {
          name: banner.name,
          imageUrl: banner.imageUrl,
          fileKey: banner.fileKey,
          order: banner.order,
        },
      });
    }
    console.log(`✅ ${bannerImages.length} Banner Images seeded successfully`);

    // =========================================================================
    // 5. SEED USERS
    // =========================================================================
    console.log("👥 Seeding Users...");

    // Note: We use email as unique identifier for upsert
    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          password: user.password,
          emailVerified: user.emailVerified,
          role: user.role,
          isRootAdmin: user.isRootAdmin,
          image: user.image,
          dateofbirth: user.dateofbirth,
          phoneNumber: user.phoneNumber,
          address: user.address,
        },
        create: {
          name: user.name,
          email: user.email,
          password: user.password,
          emailVerified: user.emailVerified,
          role: user.role,
          isRootAdmin: user.isRootAdmin,
          image: user.image,
          dateofbirth: user.dateofbirth,
          phoneNumber: user.phoneNumber,
          address: user.address,
        },
      });
    }
    console.log(`✅ ${users.length} Users seeded successfully`);

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log("\n🎉 Database seeding completed successfully!");
    console.log("═".repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   • App Settings: 1 record`);
    console.log(`   • Working Days: ${workingDays.length} records`);
    console.log(`   • Departments: ${departments.length} records`);
    console.log(`   • Banner Images: ${bannerImages.length} records`);
    console.log(`   • Users: ${users.length} records`);
    console.log("═".repeat(50));
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
