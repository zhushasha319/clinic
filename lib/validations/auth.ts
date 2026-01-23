//验证表单
import { z } from "zod";
export const signInFormSchema = z.object({
  // Validation for the email field
  email: z
    .string()
    .min(4, { message: "Email must be at least 4 characters." })
    .email({ message: "Invalid email address." }),

  // Validation for the password field
  password: z
    .string()
    .min(3, { message: "Password must be at least 3 characters." }),
});

// You can also infer the TypeScript type from the schema
export type SignInFormValues = z.infer<typeof signInFormSchema>;

export const signUpFormSchema = z.object({
    // Validation for the name field
    name: z
      .string()
      .min(3, { message: "Email must be at least 3 characters." }),
    // Validation for the email field
    email: z
      .string()
      .min(4, { message: "Email must be at least 4 characters." })
      .email({ message: "Invalid email address." }),
    // Validation for the password field
    password: z
      .string()
      .min(3, { message: "Password must be at least 3 characters." }),
    // Validation for the password field
    confirmPassword: z
      .string()
      .min(3, { message: "Password must be at least 3 characters." }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const patientProfileUpdateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phoneNumber: z
    .string()
    .min(7, "Phone number must be at least 7 characters")
    .max(20, "Phone number must be at most 20 characters")
    .regex(/^[0-9+\-]+$/, "Phone number can only contain numbers, +, and -"),
  address: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // optional
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return false;

      const now = new Date();
      // strip time for safer "date" comparisons
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dob = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      // no future dates
      if (dob > today) return false;

      // not more than 120 years ago
      const oldest = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
      if (dob < oldest) return false;

      return true;
    }, "Date of birth must be a valid date, not in the future, and not more than 120 years ago"),
});
//服务器侧
export const fullReviewDataSchema = z.object({
  appointmentId: z.string().uuid({
    message: "A valid appointment ID is required.",
  }),
 
  doctorId: z.string().uuid({
    message: "A valid doctor ID is required.",
  }),
 
  patientId: z.string().uuid({
    message: "A valid patient ID is required.",
  }),
 
  rating: z
    .number({ message: "A rating is required." })
    .int({ message: "Rating must be a whole number (e.g., 1, 2, 3, 4, or 5)." })
    .min(1, { message: "Rating must be at least 1." })
    .max(5, { message: "Rating cannot be greater than 5." }),
 
  reviewText: z
    .string()
    .min(10, { message: "Review must be at least 10 characters long." })
    .max(100, { message: "Review must be no more than 100 characters long." }),
});
 
//客户端
export const reviewFormSchema = z.object({
  rating: z
    .number({
      message: "A rating is required.",
    })
    .int({ message: "Rating must be a whole number (e.g., 1, 2, 3, 4, or 5)." })
    .min(1, { message: "Rating must be at least 1." })
    .max(5, { message: "Rating cannot be greater than 5." }),
 
  reviewText: z
    .string()
    .min(10, { message: "Review must be at least 10 characters long." })
    .max(100, { message: "Review must be no more than 100 characters long." }),
});

import { parse, isValid } from "date-fns";

/**
 * Reusable Phone Number Schema
 * - 7 to 20 chars
 * - only digits, +, -
 */
export const phoneValidationSchema = z
  .string()
  .min(7, "Phone number must be at least 7 characters.")
  .max(20, "Phone number must be at most 20 characters.")
  .regex(/^[0-9+-]+$/, "Phone number can contain only digits, '+' or '-'.");

/**
 * Reusable Date String Schema
 * - exact DD/MM/YYYY format
 * - must be a real calendar date
 */
export const validDateString = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Date must be in DD/MM/YYYY format.")
  .refine((value) => {
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    // Ensure parse didn't “fix” invalid dates like 32/01/2025 -> some other date
    return isValid(parsed) && value === `${value}`; // keep strictness; format check handled by regex
  }, "Invalid calendar date.");

/**
 * Base schema: fields common to both patient types
 */
const baseSchema = z.object({
  patientType: z.enum(["MYSELF", "SOMEONE_ELSE"]),

  // "readonly" is a UI concern; schema just validates value.
  email: z.string().email("Please enter a valid email address."),

  reason: z.string().min(1, "Reason is required."),
  notes: z.string().optional(),

  useAlternatePhone: z.boolean().optional(),
  phone: z.string().optional(), // no validation here; conditional refinement applies later
});

/**
 * "MYSELF" Schema
 * - fullName required
 * - dateOfBirth optional
 * - relationship optional
 */
const myselfSchema = baseSchema.extend({
  patientType: z.literal("MYSELF"),
  fullName: z.string().min(1, "Full name is required."),
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
  fullName: z.string().min(1, "Full name is required."),
  relationship: z.string().min(1, "Relationship is required."),
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
        // attach issue to "phone" field
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