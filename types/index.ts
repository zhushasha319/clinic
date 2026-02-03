import { Department, BannerImage } from "../lib/generated/prisma";
import {
  patientProfileUpdateSchema,
  reviewFormSchema,
} from "@/lib/validations/auth";
import { z } from "zod";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ServerActionResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errorType?: string;
  fieldErrors?: FieldErrors;
}

export type DepartmentData = Department;

export type DoctorSummary = {
  id: string;
  name: string | null;
  specialty: string | null;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
};

export interface DoctorReview {
  id: string;
  rating: number | null;
  reviewDate: string;
  testimonialText: string;
  patientName: string;
  patientImage: string | null;
}

export type BannerImageData = BannerImage;

export interface DoctorDetails {
  id: string;
  name: string;
  image: string | null;
  credentials: string;
  speciality: string;
  rating: number;
  reviewCount: number;
  languages: string[];
  specializations: string[];
  brief: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  startTimeUTC: Date;
  endTimeUTC: Date;
}
export type FieldErrors = Record<string, string[] | undefined>;
export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  image?: string;
}
export interface Appointment {
  id: string;
  doctorName: string;
  doctorId: string;
  specialty?: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled" | "no show" | "cash payment";
  reasonForVisit?: string;
  isReviewed?: boolean;
}
export type ProfileUpdateInput = z.infer<typeof patientProfileUpdateSchema>;

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export interface GuestAppointmentParams {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
}
export interface GuestAppointmentSuccessData {
  appointmentId: string;
  guestIdentifier: string;
}
export interface UserAppointmentsData {
  appointments: Appointment[];
  totalAppointments: number;
  totalPages: number;
  currentPage: number;
}
export interface AppointmentReservationParams {
  doctorId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
}
export interface ReservationSuccessData {
  appointmentId: string;
}
import type { Prisma } from "@/lib/generated/prisma";
export type AppoitmentWithRelations = Prisma.AppointmentGetPayload<{
  include: {
    doctor: {
      include: {
        doctorProfile: true;
      };
    };
  };
}>;
export interface AppointmentData {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecilaity: string;
  guestIdentifier?: string | null;
  doctorImage?: string | null;
  date: string;
  timeSlot: string;
  endTime: string;
  patientType?: "MYSELF" | "SOMEONE_ELSE";
  patientName?: string;
  patientdateofbirth?: Date | null;
  phoneNumber?: string | null;
  reasonForVisit?: string | null;
  additionalNotes?: string | null;
  relationship?: string | null;
}

export interface paymentData {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecilaity: string;
  doctorImage?: string | null;
  date: string;
  timeSlot: string;
  endTime: string;
  patientType?: "MYSELF" | "SOMEONE_ELSE";
  patientName?: string;
  patientdateofbirth?: Date | null;
  phoneNumber?: string | null;
  reasonForVisit?: string | null;
  additionalNotes?: string | null;
  relationship?: string | null;
  fee: number;
  patientEmail?: string;
  userId: string; // 用户ID用于权限验证
}
export interface PatientData {
  name: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
}
import { PatientDetailsFormSchema } from "@/lib/validations/auth";
export type PatientDetailsFormValues = z.infer<typeof PatientDetailsFormSchema>;
