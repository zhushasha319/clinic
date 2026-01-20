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
