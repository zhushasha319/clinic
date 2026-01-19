"use server";

import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { signInFormSchema, signUpFormSchema } from "../validations/auth";
import type { ServerActionResponse } from "@/types";

import { signOut } from "@/auth";
import prisma from "@/db/prisma";
import { hashSync } from "bcryptjs";

const sanitizeCallbackUrl = (value: unknown): string => {
  if (typeof value !== "string") return "/";
  if (value.length === 0) return "/";
  // Only allow in-app relative redirects. Disallow protocol-relative URLs (//...).
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  // Avoid odd Windows/backslash paths and control chars.
  if (value.includes("\\") || /[\u0000-\u001F\u007F]/.test(value)) return "/";
  return value;
};

const isNextRedirectError = (error: unknown) => {
  return (
    error instanceof Error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as unknown as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
};
export async function signInWithCredentials(
  formData: FormData
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
    const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl);

    // 2) 调用 NextAuth/Auth.js signIn
    // Auth.js / NextAuth v5：redirectTo
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });

    // Some environments/configs won't trigger an automatic redirect.
    // Ensure we always navigate to the intended in-app location.
    redirect(callbackUrl);

    // 如果 signIn 没抛错，说明流程成功（通常会重定向）
    return {
      success: true,
      message: "Signed in successfully.",
    };
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
  formData: FormData
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
  const callbackUrl = sanitizeCallbackUrl(formData.get("callbackUrl"));

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
      redirectTo: callbackUrl,
    });

    redirect(callbackUrl);

    // This part might not be reached if signIn redirects successfully
    return {
      success: true,
      message: "Sign up successful! Redirecting...",
    };
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