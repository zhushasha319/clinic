import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma";
import {
  users,
  departments,
  bannerImages,
  appSettings,
  workingDays,
  doctorProfiles,
  appointments,
  testimonials,
} from "../db/dummydata2";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL || "", {});
const prisma = new PrismaClient({ adapter });

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
    // 6. SEED DOCTOR PROFILES
    // =========================================================================
    console.log("👨‍⚕️ Seeding Doctor Profiles...");

    // Get actual doctor user IDs from database
    const drAlice = await prisma.user.findUnique({
      where: { email: "alice.williams@clinic.com" },
    });
    const drBob = await prisma.user.findUnique({
      where: { email: "bob.brown@clinic.com" },
    });
    const drCarol = await prisma.user.findUnique({
      where: { email: "carol.davis@clinic.com" },
    });

    if (drAlice && drBob && drCarol) {
      const doctorProfilesWithRealIds = [
        { ...doctorProfiles[0], userId: drAlice.id },
        { ...doctorProfiles[1], userId: drBob.id },
        { ...doctorProfiles[2], userId: drCarol.id },
      ];

      for (const profile of doctorProfilesWithRealIds) {
        await prisma.doctorProfile.upsert({
          where: { userId: profile.userId },
          update: {
            specialty: profile.specialty,
            brief: profile.brief,
            credentials: profile.credentials,
            languages: profile.languages,
            specializations: profile.specializations,
            isActive: profile.isActive,
          },
          create: profile,
        });
      }
      console.log(
        `✅ ${doctorProfilesWithRealIds.length} Doctor Profiles seeded successfully`
      );
    } else {
      console.log("⚠️  Some doctors not found, skipping doctor profiles");
    }

    // =========================================================================
    // 7. SEED APPOINTMENTS
    // =========================================================================
    console.log("📅 Seeding Appointments...");

    const johnDoe = await prisma.user.findUnique({
      where: { email: "john.doe@example.com" },
    });

    if (drAlice && johnDoe) {
      const appointmentsWithRealIds = appointments.map((apt) => ({
        ...apt,
        doctorId: drAlice.id,
        userId: johnDoe.id,
      }));

      for (const apt of appointmentsWithRealIds) {
        await prisma.appointment.create({
          data: apt,
        });
      }
      console.log(
        `✅ ${appointmentsWithRealIds.length} Appointments seeded successfully`
      );
    } else {
      console.log("⚠️  Required users not found, skipping appointments");
    }

    // =========================================================================
    // 8. SEED TESTIMONIALS
    // =========================================================================
    console.log("💬 Seeding Testimonials...");

    if (drAlice && johnDoe) {
      // Get created appointments
      const createdAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: drAlice.id,
          userId: johnDoe.id,
        },
        orderBy: {
          appointmentStartUTC: "asc",
        },
        take: 10,
      });

      if (createdAppointments.length >= 10) {
        for (let i = 0; i < testimonials.length; i++) {
          await prisma.testimonial.create({
            data: {
              appointmentId: createdAppointments[i].id,
              doctorId: drAlice.id,
              patientId: johnDoe.id,
              testimonialText: testimonials[i].testimonialText,
              rating: testimonials[i].rating,
            },
          });
        }
        console.log(
          `✅ ${testimonials.length} Testimonials seeded successfully`
        );
      } else {
        console.log("⚠️  Not enough appointments found, skipping testimonials");
      }
    } else {
      console.log("⚠️  Required users not found, skipping testimonials");
    }

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
    console.log(`   • Doctor Profiles: 3 records`);
    console.log(`   • Appointments: 10 records`);
    console.log(`   • Testimonials: 10 records`);
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
