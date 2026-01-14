"use server";

import prisma from "@/db/prisma";
import type { ServerActionResponse, DoctorReview } from "@/types";
import { format, toZonedTime } from "date-fns-tz";
import { getAppTimeZone } from "@/lib/config";

interface DoctorReviewsPaginatedData {
  reviews: DoctorReview[];
  totalReviews: number;
  totalPages: number;
  currentPage: number;
}

export async function getDoctorReviewsPaginated(
  doctorId: string,
  page: number = 1,
  pageSize: number = 10
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
    const [totalReviews, testimonials] = await prisma.$transaction([
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
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: message,
      message: "Failed to fetch doctor reviews",
    };
  }
}
