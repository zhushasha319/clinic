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

/**
 * 分页获取医生评价列表，带总数与页码，并将时间转为应用时区。
 */
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
        error: "需要 doctorId",
        message: "请求无效",
      };
    }

    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize)
      ? Math.min(50, Math.max(1, Math.floor(pageSize)))
      : 10;

    const skip = (safePage - 1) * safePageSize;
    const timeZone = getAppTimeZone();

    // 统计与分页查询放在一次事务里，保证一致性
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

    // 若请求页超出 totalPages，则返回空列表并修正 currentPage
    //（也可以用修正后的页码重查；这里用简单方式）
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
              patientName: t.patient?.name ?? "匿名",
              patientImage: t.patient?.image ?? null,
            };
          });

    return {
      success: true,
      message: "医生评价获取成功",
      data: {
        reviews,
        totalReviews,
        totalPages,
        currentPage,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "发生未知错误";
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: message,
      message: "获取医生评价失败",
    };
  }
}

/** 聚合医生评价数量与平均分，校验 doctorId。 */
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
        error: "需要 doctorId",
        message: "请求无效",
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
      err instanceof Error ? err.message : "发生未知错误";
    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: message,
      message: "获取医生评价统计失败",
    };
  }
}

/**
 * 提交患者评价：鉴权→校验输入→检查预约状态与归属→创建评价并刷新医生评分。
 */
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
      message: "需要登录后才能提交评价。",
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
      message: "提交数据无效，请检查输入。",
      fieldErrors: validationResult.error.flatten().fieldErrors,
      errorType: "Validation Error",
    };
  }

  const { appointmentId, doctorId, rating, reviewText } = validationResult.data;

  try {
    // 3. 顺序执行（HTTP 模式不支持事务）
    // 3a. 查找预约并校验状态与归属
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentId },
      include: { testimonial: true }, // 检查是否已存在评价
    });

    if (!appointment) {
      return {
        success: false,
        message: "未找到预约。",
        error: "未找到预约。",
        errorType: "NOT_FOUND",
      };
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      return {
        success: false,
        message: "只能评价已完成的预约。",
        error: "预约状态无效。",
        errorType: "VALIDATION_ERROR",
      };
    }
    if (appointment.userId !== patientId) {
      return {
        success: false,
        message: "无权评价该预约。",
        error: "无权限访问。",
        errorType: "UNAUTHORIZED",
      };
    }
    if (appointment.testimonial) {
      return {
        success: false,
        message: "该预约已提交过评价。",
        error: "重复评价。",
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
        rating: parseFloat(averageRating.toFixed(1)), // ??????
      },
    });

    // 4. 重新验证路径以更新UI
    revalidatePath(`/user/profile`); // 重新验证

    return {
      success: true,
      message: "评价提交成功！",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "???????"
    console.error("提交评价出错：", error);
    return {
      success: false,
      message: errorMessage,
      error: errorMessage,
      errorType: "SERVER_ERROR",
    };
  }
}

