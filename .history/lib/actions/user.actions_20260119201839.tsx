"use server";

import { signIn } from "@/auth";
import { signInFormSchema, signUpFormSchema } from "../validations/auth";
import type {
  ServerActionResponse,
  PatientProfile,
  Appointment as AppointmentDTO,
} from "@/types";
import { auth } from "@/auth";
import { signOut } from "@/auth";
import prisma from "@/db/prisma";
import { hashSync } from "bcryptjs";
import { redirect } from "next/navigation";

const isNextRedirectError = (error: unknown) => {
  return (
    error instanceof Error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as unknown as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
};
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
      err instanceof Error ? err.message : "Something went wrong.";

    return {
      success: false,
      error: message,
      errorType: "AUTH_ERROR",
    };
  }
}

export async function signOutUser(): Promise<ServerActionResponse> {
  try {
    // Auth.js / NextAuth v5 server-side signOut
    await signOut({ redirectTo: "/" });

    // 一般情况下这行不会执行（因为会 redirect）
    return {
      success: true,
      message: "Signed out successfully.",
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to sign out.",
      errorType: "SIGN_OUT_ERROR",
    };
  }
}
export async function signUp(
  _prevState: ServerActionResponse,
  formData: FormData,
): Promise<ServerActionResponse> {
  // Extract data from formData by converting it to an object
  const formValues = Object.fromEntries(formData.entries());

  // Validate the form data using the new schema
  const validationResult = signUpFormSchema.safeParse(formValues);

  if (!validationResult.success) {
    return {
      success: false,
      message: "Validation failed.",
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validationResult.data;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    // Check if a user with the given email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message:
          "Please use another email as a User with this email already exists",
        error: "A user with this email already exists.",
        errorType: "Conflict",
      };
    }

    // Hash the password before saving it to the database
    //const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user in the database
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashSync(password, 10),
      },
    });

    // Sign in the user automatically after successful registration
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // Manually redirect to callbackUrl after successful sign up
    redirect(callbackUrl);
  } catch (error: unknown) {
    if (isNextRedirectError(error)) throw error;
    const errorMessage =
      error instanceof Error ? error.message : "Unkown error type caught.";

    return {
      success: false,
      error: errorMessage,
      message: "Sign up did not suceed. Please try again.",
      errorType: "SERVER_ERROR",
    };
  }
}
//sign up逻辑：验证表单格式→检查用户是否存在→哈希密码→创建用户→自动登录


//完成user file,包括个人信息和预约
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
        message: "You must be logged in to view user details.",
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
        message: "No user record exists for the current session.",
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
      message: "User details fetched successfully.",
    };
  } catch (err: unknown) {
    // 生产环境别把 err.message 原样回传给前端也行
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong",
      errorType: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user details.",
    };
  }
}

import { getAppTimeZone } from "@/lib/config";
import { toZonedTime, format } from "date-fns-tz";

// ---- Types for this action ----
interface UserAppointmentsData {
  appointments: AppointmentDTO[];
  totalAppointments: number;
  totalPages: number;
  currentPage: number;
}

// ---- Helpers ----
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function mapAppointmentStatus(status: string): AppointmentDTO["status"] | null {
  // Exclude PAYMENT_PENDING upstream, but keep this defensive.
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
      // If your enum has more statuses, decide whether to drop or map them.
      // Here we drop unknowns to avoid sending invalid union values.
      return null;
  }
}

function formatInAppTZ(dateUTC: Date, timeZone: string) {
  const zoned = toZonedTime(dateUTC, timeZone);
  return {
    date: format(zoned, "MMMM d,yyyy", { timeZone }),
    time: format(zoned, "hh:mm a", { timeZone }), // nice UX; adjust if you want 24h
  };
}

export async function getUserAppointments(params?: {
  page?: number;
  limit?: number;
}): Promise<ServerActionResponse<UserAppointmentsData>> {
  try {
    // 1) Auth
    const session = await auth();
    const email = session?.user?.email ?? null;

    if (!email) {
      return {
        success: false,
        error: "Unauthorized",
        errorType: "UNAUTHORIZED",
        message: "You must be logged in to view appointments.",
      };
    }

    // 2) Resolve user id
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
        errorType: "NOT_FOUND",
        message: "No user record exists for the current session.",
      };
    }

    // 3) Pagination
    const page = clampInt(params?.page, DEFAULT_PAGE, 1, 10_000);
    const limit = clampInt(params?.limit, DEFAULT_LIMIT, 1, 100);
    const skip = (page - 1) * limit;

    // 4) Filter (exclude PAYMENT_PENDING)
    const where = {
      userId: user.id,
      NOT: { status: "PAYMENT_PENDING" as const },
    };

    // 5) Query count + current page rows
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

    // 6) Map to DTO
    const appointments: AppointmentDTO[] = rows
      .map((a) => {
        const mappedStatus = mapAppointmentStatus(String(a.status));
        if (!mappedStatus) return null;

        const { date, time } = formatInAppTZ(a.appointmentStartUTC, tz);

        return {
          id: a.appointmentId,
          doctorId: a.doctorId,
          doctorName: a.doctor?.name ?? "Unknown Doctor",
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
      message: "Appointments fetched successfully.",
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
      error: "Something went wrong",
      errorType: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user appointments.",
    };
  }
}

import { extractFileKeyFromUrl } from "../utils/file-url-helpers";
//处理上传头像
export async function updateProfileImage(
  imageUrl: string
): Promise<ServerActionResponse> {
  // 1. Authenticate the user
  const session = await auth();
 
  if (!session?.user?.id) {
    return {
      success: false,
      message: "User not authenticated",
      error: "Unauthorized: You must be logged in to update your profile.",
      errorType: "AUTHENTICATION",
    };
  }
 
  const { id: userId } = session.user;
 
  try {
    // Get the current user to find the old image URL
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
 
    const oldImageUrl = currentUser?.image;
 
    // 2. Extract file key from the old image URL if it exists
    const oldFileKey = extractFileKeyFromUrl(oldImageUrl);
 
    // 3. Update just the image field in the database
    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });
 
    // 4. Attempt to delete the old image if it exists
    if (oldFileKey) {
      try {
        // We don't want the entire action to fail if the old file deletion fails.
        // This could happen if the file was already deleted or if there's a temporary issue with the storage provider.
        // We'll proceed even if this step throws an error, but we'll log it.
        await utapi.deleteFiles(oldFileKey);
      } catch (deleteError) {
        console.log(
          `Failed to delete old profile image for user ${userId} with key ${oldFileKey}.`,
          deleteError
        );
        // Note: We are not returning an error response here because the primary action (updating the DB) was successful.
      }
    }
 
    // 5. Revalidate the user profile page to reflect changes immediately
    // Adjust the path as needed for your application structure.
 
    revalidatePath("/user/profile"); // Revalidate a public profile page if it exists
 
    return {
      success: true,
      message: "Profile image updated successfully.",
    };
  } catch (error) {
    console.error("Error updating profile image:", error);
    return {
      success: false,
      message: "Failed to update profile image. Please try again later.",
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: "SERVER_ERROR",
    };
  }
}

