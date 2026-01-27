"use server";

import { signIn } from "@/auth";
import { signInFormSchema, signUpFormSchema } from "../validations/auth";
import type {
  ServerActionResponse,
  PatientProfile,
  Appointment as AppointmentDTO,
  UserAppointmentsData,
} from "@/types";
import { auth } from "@/auth";
import { signOut } from "@/auth";
import prisma from "@/db/prisma";
import { hashSync } from "bcryptjs";
import { redirect } from "next/navigation";
import { extractFileKeyFromUrl } from "../uploadthing-helper";
import { utapi } from "../uploadthing";
import { getAppTimeZone } from "@/lib/config";
import { toZonedTime, format } from "date-fns-tz";
import { revalidatePath as nextRevalidatePath } from "next/cache";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/** 判断错误是否为 Next.js 重定向错误，便于向上抛出。 */
const isNextRedirectError = (error: unknown) => {
  return (
    error instanceof Error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as unknown as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
};
/**
 * 账号密码登录：Zod 校验→调用 Auth.js 登录（无自动跳转）→手动重定向到 callbackUrl。
 */
export async function signInWithCredentials(
  formData: FormData,
): Promise<ServerActionResponse> {
  try {
    const rawEmail = formData.get("email");
    const rawPassword = formData.get("password");
    const rawCallbackUrl = formData.get("callbackUrl");

    // 统一转成 string（否则可能是 null / File）
    const input = {
      email: typeof rawEmail === "string" ? rawEmail : "",
      password: typeof rawPassword === "string" ? rawPassword : "",
    };

    // 1) Zod 校验
    const parsed = signInFormSchema.safeParse(input);
    if (!parsed.success) {
      // 取第一条错误信息（你也可以把全部 errors 返回）
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return {
        success: false,
        error: firstError,
        errorType: "VALIDATION_ERROR",
      };
    }

    const { email, password } = parsed.data;

    // callbackUrl 可选，给个安全默认值
    const callbackUrl =
      typeof rawCallbackUrl === "string" && rawCallbackUrl.length > 0
        ? rawCallbackUrl
        : "/";

    // 2) 调用 NextAuth/Auth.js signIn (不让它自动重定向)
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // 3) 登录成功后手动重定向到 callbackUrl
    redirect(callbackUrl);
  } catch (err: unknown) {
    if (isNextRedirectError(err)) throw err;
    // 常见：Auth.js 会抛出某些错误（比如 CredentialsSignin / 回调错误等）
    const message =
      err instanceof Error ? err.message : "出现错误。";

    return {
      success: false,
      error: message,
      errorType: "AUTH_ERROR",
    };
  }
}

/** 服务器侧登出当前用户，使用 Auth.js signOut 并返回结果。 */
export async function signOutUser(): Promise<ServerActionResponse> {
  try {
    // Auth.js / NextAuth v5 server-side signOut
    await signOut({ redirectTo: "/" });

    // 一般情况下这行不会执行（因为会 redirect）
    return {
      success: true,
      message: "已成功退出登录。",
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "退出登录失败。",
      errorType: "SIGN_OUT_ERROR",
    };
  }
}
/**
 * 用户注册：校验表单→检测重复邮箱→创建用户→自动登录并重定向。
 */
export async function signUp(
  _prevState: ServerActionResponse,
  formData: FormData,
): Promise<ServerActionResponse> {
  // 将 formData 转成对象以提取数据
  const formValues = Object.fromEntries(formData.entries());

  // 使用新 schema 校验表单数据
  const validationResult = signUpFormSchema.safeParse(formValues);

  if (!validationResult.success) {
    return {
      success: false,
      message: "校验失败。",
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validationResult.data;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    // 检查该邮箱是否已存在用户
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message:
          "该邮箱已被注册，请使用其他邮箱。",
        error: "该邮箱已被注册。",
        errorType: "Conflict",
      };
    }

    // 保存前先对密码进行哈希
    //const hashedPassword = await bcrypt.hash(password, 10);

    // 在数据库中创建新用户
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashSync(password, 10),
      },
    });

    // 注册成功后自动登录
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // 注册成功后手动重定向到 callbackUrl
    redirect(callbackUrl);
  } catch (error: unknown) {
    if (isNextRedirectError(error)) throw error;
    const errorMessage =
      error instanceof Error ? error.message : "捕获到未知错误类型。";

    return {
      success: false,
      error: errorMessage,
      message: "注册失败，请重试。",
      errorType: "SERVER_ERROR",
    };
  }
}
//sign up逻辑：验证表单格式→检查用户是否存在→哈希密码→创建用户→自动登录

//完成user file,包括个人信息和预约
/** 获取当前登录用户的基础资料并映射为 PatientProfile。 */
export async function getUserDetails(): Promise<
  ServerActionResponse<PatientProfile>
> {
  try {
    // ✅ 1) 获取当前登录用户
    // const session = await getServerSession(authOptions);
    const session = await auth();

    const email = session?.user?.email ?? null;

    if (!email) {
      return {
        success: false,
        error: "Unauthorized",
        errorType: "UNAUTHORIZED",
        message: "请先登录后查看用户信息。",
      };
    }

    // ✅ 2) 查询用户（只选需要的字段）
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        image: true,
        dateofbirth: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
        errorType: "NOT_FOUND",
        message: "当前会话不存在用户记录。",
      };
    }

    // ✅ 3) 映射为 PatientProfile（注意 dateofbirth -> dateOfBirth）
    const profile: PatientProfile = {
      id: user.id,
      name: user.name ?? "NO_NAME",
      email: user.email,
      phoneNumber: user.phoneNumber ?? undefined,
      address: user.address ?? undefined,
      image: user.image ?? undefined,
      dateOfBirth: user.dateofbirth
        ? user.dateofbirth.toISOString()
        : undefined,
    };

    return {
      success: true,
      data: profile,
      message: "用户信息获取成功。",
    };
  } catch (err: unknown) {
    // 生产环境别把 err.message 原样回传给前端也行
    return {
      success: false,
      error: err instanceof Error ? err.message : "发生错误",
      errorType: "INTERNAL_SERVER_ERROR",
      message: "获取用户信息失败。",
    };
  }
}

/**
 * 将任意输入收敛为限定区间内的整数，用于分页等安全数值处理。
 */
function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/**
 * 将数据库预约状态映射为前端展示用的文案，过滤待支付状态。
 */
function mapAppointmentStatus(status: string): AppointmentDTO["status"] | null {
  //如果是待支付，就忽略
  if (status === "PAYMENT_PENDING") return null;

  switch (status) {
    case "BOOKING_CONFIRMED":
      return "upcoming";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    case "NO_SHOW":
      return "no show";
    case "CASH":
      return "cash payment";
    default:
      return null;
  }
}

/** 按应用时区格式化 UTC 时间，返回日期和时间字符串。 */
function formatInAppTZ(dateUTC: Date, timeZone: string) {
  const zoned = toZonedTime(dateUTC, timeZone);
  return {
    date: format(zoned, "MMMM d,yyyy", { timeZone }),
    time: format(zoned, "hh:mm a", { timeZone }),
  };
}

/**
 * 分页获取当前用户的预约列表（排除待支付），并转换为展示 DTO。
 */
export async function getUserAppointments(params?: {
  page?: number;
  limit?: number;
}): Promise<ServerActionResponse<UserAppointmentsData>> {
  try {
    // 1) 认证
    const session = await auth();
    const email = session?.user?.email ?? null;

    if (!email) {
      return {
        success: false,
        error: "Unauthorized",
        errorType: "UNAUTHORIZED",
        message: "请先登录后查看预约。",
      };
    }

    // 2) 解析用户 id
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
        errorType: "NOT_FOUND",
        message: "当前会话不存在用户记录。",
      };
    }

    // 3) 分页
    const page = clampInt(params?.page, DEFAULT_PAGE, 1, 10_000);
    const limit = clampInt(params?.limit, DEFAULT_LIMIT, 1, 100);
    const skip = (page - 1) * limit;

    // 4) 过滤（排除 PAYMENT_PENDING）
    const where = {
      userId: user.id,
      NOT: { status: "PAYMENT_PENDING" as const },
    };

    // 5) 查询总数与当前页数据
    const [totalAppointments, rows] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        orderBy: { appointmentStartUTC: "desc" },
        skip,
        take: limit,
        select: {
          appointmentId: true,
          doctorId: true,
          appointmentStartUTC: true,
          status: true,
          reasonForVisit: true,
          testimonial: { select: { testimonialId: true } },
          doctor: {
            select: {
              name: true,
              doctorProfile: {
                select: {
                  specialty: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalAppointments / limit));
    const currentPage = Math.min(page, totalPages);

    const tz = getAppTimeZone();

    // 6) 映射为 DTO
    const appointments: AppointmentDTO[] = rows
      .map((a) => {
        const mappedStatus = mapAppointmentStatus(String(a.status));
        if (!mappedStatus) return null;

        const { date, time } = formatInAppTZ(a.appointmentStartUTC, tz);

        return {
          id: a.appointmentId,
          doctorId: a.doctorId,
          doctorName: a.doctor?.name ?? "未知医生",
          specialty: a.doctor?.doctorProfile?.specialty ?? undefined,
          date, // 'MMMM d,yyyy'
          time, // derived from start time in app TZ
          status: mappedStatus,
          reasonForVisit: a.reasonForVisit ?? undefined,
          isReviewed: Boolean(a.testimonial?.testimonialId),
        } satisfies AppointmentDTO;
      })
      .filter(Boolean) as AppointmentDTO[];

    return {
      success: true,
      message: "预约获取成功。",
      data: {
        appointments,
        totalAppointments,
        totalPages,
        currentPage,
      },
    };
  } catch {
    return {
      success: false,
      error: "发生错误",
      errorType: "INTERNAL_SERVER_ERROR",
      message: "获取预约失败。",
    };
  }
}

//处理上传头像
/** 更新用户头像：保存新图、尝试删除旧图，并重新验证个人资料页面。 */
export async function updateProfileImage(
  imageUrl: string,
): Promise<ServerActionResponse> {
  // 1. 验证用户
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "用户未登录",
      error: "未授权：请登录后再更新资料。",
      errorType: "AUTHENTICATION",
    };
  }

  const { id: userId } = session.user;

  try {
    // 获取当前用户以找到旧头像 URL
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    const oldImageUrl = currentUser?.image;

    // 2. 提取旧头像URL中的文件键（如果存在）
    const oldFileKey = extractFileKeyFromUrl(oldImageUrl);

    // 3. 仅更新数据库中的头像字段
    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    // 4. 尝试删除旧头像（如果存在）
    if (oldFileKey) {
      try {
        // 我们不希望整个操作因为旧文件删除失败而失败。
        // 这可能发生在文件已经被删除或者存储提供商出现临时问题时。
        // 即使这一步抛出错误，我们也会继续，但会记录日志。
        await utapi.deleteFiles(oldFileKey);
      } catch (deleteError) {
        console.log(
          `删除旧头像失败，用户 ${userId} with key ${oldFileKey}.`,
          deleteError,
        );
      }
    }

    // 5. 重新验证用户个人资料页面以立即反映更改
    // 根据您的应用程序结构调整路径。

    revalidatePath("/user/profile"); // ?????????????

    return {
      success: true,
      message: "头像更新成功。",
    };
  } catch (error) {
    console.error("更新头像出错：", error);
    return {
      success: false,
      message: "更新头像失败，请稍后再试。",
      error: error instanceof Error ? error.message : "未知错误",
      errorType: "SERVER_ERROR",
    };
  }
}

/** ?? next/cache ? revalidatePath???????????? */
function revalidatePath(path: string) {
  if (typeof path !== "string" || !path.trim()) return;
  nextRevalidatePath(path);
}

//更新个人资料

import { patientProfileUpdateSchema } from "@/lib/validations/auth";
import type { ProfileUpdateInput } from "@/types";
import { z } from "zod";

/**
 * 更新用户个人资料：鉴权→Zod 校验→组装可选字段→更新数据库并刷新页面。
 */
export async function updateUserProfile(
  data: ProfileUpdateInput,
): Promise<ServerActionResponse<{ id: string }>> {
  try {
    // 1) 认证
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        errorType: "UNAUTHORIZED",
        error: "请登录后再更新资料。",
      };
    }

    // 2) 使用 Zod 校验输入（无效则返回 fieldErrors）
    const parsed = patientProfileUpdateSchema.safeParse(data);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;

      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        message: "请修正高亮的字段。",
        fieldErrors,
      };
    }

    const { name, address, phoneNumber, dateOfBirth } = parsed.data;

    // 3) 构建更新数据（仅包含有值的可选字段）
    const updateData: {
      name: string;
      address?: string | null;
      phoneNumber: string;
      dateofbirth?: Date | null;
    } = {
      name,
      phoneNumber,
      address: address?.trim() || null,
      dateofbirth: dateOfBirth ? new Date(dateOfBirth) : null,
    };

    // 4) 更新用户
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 5) 重新验证资料页以显示更新
    nextRevalidatePath("/user/profile");

    return {
      success: true,
      message: "资料更新成功。",
      data: { id: userId },
    };
  } catch (err: unknown) {
    // Prisma 特定错误处理
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2025"
    ) {
      return {
        success: false,
        errorType: "NOT_FOUND",
        error: "未找到用户。",
      };
    }

    // 理论上 Zod 已提前捕获，但这里保持健壮性
    if (err instanceof z.ZodError) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        message: "请修正高亮的字段。",
        fieldErrors: err.flatten().fieldErrors,
      };
    }

    console.error("updateUserProfile 出错：", err);

    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: "发生错误 while updating your profile.",
    };
  }
}

