import { z } from "zod";
export const signInFormSchema = z.object({
  // 邮箱字段校验
  email: z
    .string()
    .min(4, { message: "邮箱至少需要 4 个字符。" })
    .email({ message: "邮箱格式不正确。" }),

  // 密码字段校验
  password: z.string().min(3, { message: "密码至少需要 3 个字符。" }),
});

// 也可以从 schema 推导 TypeScript 类型
export type SignInFormValues = z.infer<typeof signInFormSchema>;

export const signUpFormSchema = z
  .object({
    // 姓名字段校验
    name: z.string().min(3, { message: "姓名至少需要 3 个字符。" }),
    // 邮箱字段校验
    email: z
      .string()
      .min(4, { message: "邮箱至少需要 4 个字符。" })
      .email({ message: "邮箱格式不正确。" }),
    // 密码字段校验
    password: z.string().min(3, { message: "密码至少需要 3 个字符。" }),
    // 密码字段校验
    confirmPassword: z.string().min(3, { message: "密码至少需要 3 个字符。" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

export const patientProfileUpdateSchema = z.object({
  name: z.string().min(3, "姓名至少 3 个字符"),
  phoneNumber: z
    .string()
    .min(7, "手机号至少 7 位")
    .max(20, "手机号最多 20 位")
    .regex(/^[0-9+\-]+$/, "手机号只能包含数字、+ 和 -"),
  address: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // 可选
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return false;

      const now = new Date();
      // 去掉时间，避免日期比较误差
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dob = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      // 不能是未来日期
      if (dob > today) return false;

      // 不能早于 120 年前
      const oldest = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );
      if (dob < oldest) return false;

      return true;
    }, "出生日期必须有效，不能是未来日期，且不能早于 120 年前"),
});
//鏈嶅姟鍣ㄤ晶
export const fullReviewDataSchema = z.object({
  appointmentId: z.string().uuid({
    message: "需要有效的预约 ID。",
  }),

  doctorId: z.string().uuid({
    message: "需要有效的医生 ID。",
  }),

  patientId: z.string().uuid({
    message: "需要有效的患者 ID。",
  }),

  rating: z
    .number({ message: "请提供评分。" })
    .int({ message: "评分必须是整数（如 1、2、3、4、5）。" })
    .min(1, { message: "评分至少为 1。" })
    .max(5, { message: "评分不能大于 5。" }),

  reviewText: z
    .string()
    .min(10, { message: "评价至少 10 个字符。" })
    .max(100, { message: "评价最多 100 个字符。" }),
});

// ???
export const reviewFormSchema = z.object({
  rating: z
    .number({
      message: "请提供评分。",
    })
    .int({ message: "评分必须是整数（如 1、2、3、4、5）。" })
    .min(1, { message: "评分至少为 1。" })
    .max(5, { message: "评分不能大于 5。" }),

  reviewText: z
    .string()
    .min(10, { message: "评价至少 10 个字符。" })
    .max(100, { message: "评价最多 100 个字符。" }),
});

import { isValid } from "date-fns";

/** 手动解析 DD/MM/YYYY 格式的日期 */
function parseDDMMYYYY(value: string): Date | null {
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const d = new Date(year, month - 1, day);
  // 验证日期没有被自动修正（如 32/01/2025 -> 01/02/2025）
  if (
    d.getDate() !== day ||
    d.getMonth() !== month - 1 ||
    d.getFullYear() !== year
  ) {
    return null;
  }
  return d;
}

/**
 * Reusable Phone Number Schema
 * - 7 to 20 chars
 * - only digits, +, -
 */
export const phoneValidationSchema = z
  .string()
  .min(7, "手机号至少 7 位.")
  .max(20, "手机号最多 20 位.")
  .regex(/^[0-9+-]+$/, "Phone number can contain only digits, '+' or '-'.");

/**
 * Reusable Date String Schema
 * - exact DD/MM/YYYY format
 * - must be a real calendar date
 */
export const validDateString = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, "日期格式必须为 DD/MM/YYYY。")
  .refine((value) => {
    const parsed = parseDDMMYYYY(value);
    return parsed !== null && isValid(parsed);
  }, "无效的日期。");

/**
 * Base schema: fields common to both patient types
 */
const baseSchema = z.object({
  patientType: z.enum(["MYSELF", "SOMEONE_ELSE"]),

  // “readonly” 属于 UI 关心点；schema 仅校验值。
  // 允许访客流程 email 为空；登录用户仍会校验邮箱格式。
  email: z.union([z.literal(""), z.string().email("请输入正确的邮箱地址。")]),

  reason: z.string().min(1, "请填写就诊原因。"),
  notes: z.string().optional(),

  useAlternatePhone: z.boolean().optional(),
  phone: z.string().optional(), // 这里不校验；后续条件校验处理
});

/**
 * "MYSELF" Schema
 * - fullName required
 * - dateOfBirth optional
 * - relationship optional
 */
const myselfSchema = baseSchema.extend({
  patientType: z.literal("MYSELF"),
  fullName: z.string().min(1, "请填写姓名。"),
  dateOfBirth: validDateString.optional(),
  relationship: z.string().optional(),
});

/**
 * "SOMEONE_ELSE" Schema
 * - fullName required
 * - relationship required
 * - dateOfBirth required (validDateString)
 */
const someoneElseSchema = baseSchema.extend({
  patientType: z.literal("SOMEONE_ELSE"),
  fullName: z.string().min(1, "请填写姓名。"),
  relationship: z.string().min(1, "请填写关系。"),
  dateOfBirth: validDateString,
});

/**
 * Final schema (union) + conditional phone validation
 * - If useAlternatePhone is true -> phone must satisfy phoneValidationSchema
 */
export const PatientDetailsFormSchema = z
  .discriminatedUnion("patientType", [myselfSchema, someoneElseSchema])
  .superRefine((data, ctx) => {
    if (data.useAlternatePhone) {
      const phone = data.phone ?? "";
      const result = phoneValidationSchema.safeParse(phone);

      if (!result.success) {
        // 将错误附加到 "phone" 字段
        for (const issue of result.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["phone"],
          });
        }
      }
    }
  });
