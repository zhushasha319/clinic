"use server";

import { signIn } from "@/auth";
import { signInFormSchema, signUpFormSchema } from "../validations/auth";
import type { ServerActionResponse } from "@/types";

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


import type { ServerActionResponse,  } from "@/types"; // 按你项目路径改
import  getServerSession  from "next-auth";
import { auth } from "@/auth";

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
      dateOfBirth: user.dateofbirth ? user.dateofbirth.toISOString() : undefined,
    };

    return {
      success: true,
      data: profile,
      message: "User details fetched successfully.",
    };
  } catch (err: unknown) {
    // 生产环境别把 err.message 原样回传给前端也行（可换成固定文案）
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong",
      errorType: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user details.",
    };
  }
}
