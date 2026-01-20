"use server";

import prisma from "@/db/prisma";
import type { ServerActionResponse, DoctorReview } from "@/types";
import { format, toZonedTime } from "date-fns-tz";
import { getAppTimeZone } from "@/lib/config";
import { auth } from "@/auth";
import { fullReviewDataSchema } from "../validations/auth";
import { AppointmentStatus } from "../generated/prisma";
import { revalidatePath } from "next/cache";

interface DoctorReviewsPaginatedData {
  reviews: DoctorReview[];
  totalReviews: number;
  totalPages: number;
  currentPage: number;
}

export async function getDoctorReviewsPaginated(
  doctorId: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<ServerActionResponse<DoctorReviewsPaginatedData>> {
  try {
    if (!doctorId?.trim()) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "doctorId is required",
        message: "Invalid request",
      };
    }

    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize)
      ? Math.min(50, Math.max(1, Math.floor(pageSize)))
      : 10;

    const skip = (safePage - 1) * safePageSize;
    const timeZone = getAppTimeZone();

    // Count + page query in a single transaction for consistency
    const [totalReviews, testimonials] = await Promise.all([
      prisma.doctorTestimonial.count({
        where: { doctorId },
      }),
      prisma.doctorTestimonial.findMany({
        where: { doctorId },
        orderBy: { createdAt: "desc" },
        skip,
        take: safePageSize,
        select: {
          testimonialId: true,
          rating: true,
          createdAt: true,
          testimonialText: true,
          patient: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalReviews / safePageSize));
    const currentPage = Math.min(safePage, totalPages);

    // If the requested page is beyond totalPages, return empty list but corrected currentPage
    // (alternatively you can re-run the query with the corrected page; this keeps it simple)
    const reviews: DoctorReview[] =
      safePage > totalPages
        ? []
        : testimonials.map((t) => {
            const zoned = toZonedTime(t.createdAt, timeZone);
            const reviewDate = format(zoned, "yyyy-MM-dd HH:mm", { timeZone });

            return {
              id: t.testimonialId,
              rating: t.rating ?? null,
              reviewDate,
              testimonialText: t.testimonialText,
              patientName: t.patient?.name ?? "Anonymous",
              patientImage: t.patient?.image ?? null,
            };
          });

    return {
      success: true,
      message: "Doctor reviews fetched successfully",
      data: {
        reviews,
        totalReviews,
        totalPages,
        currentPage,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: message,
      message: "Failed to fetch doctor reviews",
    };
  }
}

export async function getDoctorReviewStats(
  doctorId: string,
): Promise<
  ServerActionResponse<{ totalReviews: number; averageRating: number }>
> {
  try {
    if (!doctorId?.trim()) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "doctorId is required",
        message: "Invalid request",
      };
    }

    const aggregate = await prisma.doctorTestimonial.aggregate({
      where: { doctorId },
      _avg: { rating: true },
      _count: { testimonialId: true },
    });

    const totalReviews = Number(aggregate._count?.testimonialId ?? 0);
    const averageRating = Number(aggregate._avg?.rating ?? 0);

    return {
      success: true,
      data: {
        totalReviews,
        averageRating,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: message,
      message: "Failed to fetch doctor review stats",
    };
  }
}

export async function submitPatientReview(clientData: {
  appointmentId: string;
  doctorId: string;
  rating: number;
  reviewText: string;
}): Promise<ServerActionResponse> {
  // 1. 验证用户身份
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      message: "Authentication required. Please log in to submit a review.",
      errorType: "Unauthorized",
    };
  }
  const patientId = session.user.id;

  // 2.通过zod验证输入数据
  const fullData = { ...clientData, patientId };
  const validationResult = fullReviewDataSchema.safeParse(fullData);

  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid data provided. Please check your input.",
      fieldErrors: validationResult.error.flatten().fieldErrors,
      errorType: "Validation Error",
    };
  }

  const { appointmentId, doctorId, rating, reviewText } = validationResult.data;

  try {
    // 3. Sequential operations (HTTP mode doesn't support transactions)
    // 3a. Find the appointment and verify its status and ownership
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId },
      include: { testimonial: true }, // Check if a testimonial already exists
    });

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found.",
        error: "Appointment not found.",
        errorType: "NOT_FOUND",
      };
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      return {
        success: false,
        message: "Reviews can only be submitted for completed appointments.",
        error: "Invalid appointment status.",
        errorType: "VALIDATION_ERROR",
      };
    }
    if (appointment.userId !== patientId) {
      return {
        success: false,
        message: "You are not authorized to review this appointment.",
        error: "Unauthorized access.",
        errorType: "UNAUTHORIZED",
      };
    }
    if (appointment.testimonial) {
      return {
        success: false,
        message: "A review has already been submitted for this appointment.",
        error: "Duplicate review.",
        errorType: "CONFLICT",
      };
    }

    // 3b. 创建新的评价
    await prisma.doctorTestimonial.create({
      data: {
        appointmentId,
        doctorId,
        patientId,
        rating,
        testimonialText: reviewText,
      },
    });

    // 3c. 计算医生的新平均评分和评价数量
    const stats = await prisma.doctorTestimonial.aggregate({
      where: { doctorId },
      _avg: {
        rating: true,
      },
      _count: {
        testimonialId: true,
      },
    });

    const reviewCount = stats._count.testimonialId;
    const averageRating = stats._avg.rating || 0;

    // 3d. 更新医生的资料
    await prisma.doctorProfile.update({
      where: { userId: doctorId },
      data: {
        reviewCount,
        rating: parseFloat(averageRating.toFixed(1)), // 存储为1位小数
      },
    });

    // 4. 重新验证路径以更新UI
    revalidatePath(`/user/profile`); // 重新验证

    return {
      success: true,
      message: "Your review has been submitted successfully!",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error submitting patient review:", error);
    return {
      success: false,
      message: errorMessage,
      error: errorMessage,
      errorType: "SERVER_ERROR",
    };
  }
}
