"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useTranslations } from "@/hooks/useTranslations";

import type {
  AppointmentData,
  PatientData,
  PatientDetailsFormValues,
} from "@/types";
import { processAppointmentBooking } from "@/lib/actions/appointment/appointment.action";
import { PatientDetailsFormSchema } from "@/lib/validations/auth";

import { cn } from "@/lib/utils";
import { Pencil, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";

interface PatientDetailsFormProps {
  appointmentData: AppointmentData;
  patientDetails: PatientData;
}

const REASON_OPTIONS = [
  "General Consultation",
  "Follow-up Visit",
  "Prescription Refill",
  "Lab Results",
  "Cardiology Consultation",
  "Other",
];

const RELATIONSHIP_OPTIONS = [
  "Parent",
  "Child",
  "Spouse",
  "Sibling",
  "Relative",
  "Friend",
  "Caregiver",
  "Other",
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function PatientDetailsForm({
  appointmentData,
  patientDetails,
}: PatientDetailsFormProps) {
  const router = useRouter();
  const t = useTranslations("appointments");

  const defaultPatientType = appointmentData.patientType ?? ("MYSELF" as const);

  const defaultValues = useMemo<PatientDetailsFormValues>(() => {
    // Schema expects date strings DD/MM/YYYY
    const dobFromAppointment =
      appointmentData.patientdateofbirth instanceof Date
        ? `${String(appointmentData.patientdateofbirth.getDate()).padStart(
            2,
            "0",
          )}/${String(
            appointmentData.patientdateofbirth.getMonth() + 1,
          ).padStart(
            2,
            "0",
          )}/${appointmentData.patientdateofbirth.getFullYear()}`
        : undefined;

    // For MYSELF: always use latest patientDetails.name
    // For SOMEONE_ELSE: use appointmentData.patientName (the "someone else"'s name)
    const fullName =
      defaultPatientType === "MYSELF"
        ? (patientDetails.name ?? "")
        : (appointmentData.patientName ?? "");

    return {
      patientType: defaultPatientType,
      fullName,
      email: patientDetails.email ?? "",
      phone: appointmentData.phoneNumber ?? undefined,
      useAlternatePhone: false,
      reason: appointmentData.reasonForVisit ?? "",
      notes: appointmentData.additionalNotes ?? "",
      relationship: appointmentData.relationship ?? undefined,
      dateOfBirth: dobFromAppointment, // only used/required for SOMEONE_ELSE
    } as PatientDetailsFormValues;
  }, [appointmentData, patientDetails, defaultPatientType]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientDetailsFormValues>({
    resolver: zodResolver(PatientDetailsFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  // If appointmentData changes (rare, but possible), keep form in sync
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const patientType = watch("patientType");
  const useAlternatePhone = watch("useAlternatePhone");

  const onSubmit = async (values: PatientDetailsFormValues) => {
    const payload = {
      ...values,
      patientdateofbirth: values.dateOfBirth,
      appointmentId: appointmentData.appointmentId,
      doctorId: appointmentData.doctorId,
      date: appointmentData.date,
      timeSlot: appointmentData.timeSlot,
      endTime: appointmentData.endTime,
      isForSelf: values.patientType === "MYSELF",
      phone: values.useAlternatePhone
        ? values.phone
        : patientDetails.phoneNumber,
    };

    const res = await processAppointmentBooking(payload);
    if (res.success) {
      const appointmentId = res.data?.appointmentId;
      if (!appointmentId) {
        toast.error("Missing appointmentId from server response.");
        return;
      }
      toast.success(res.message || "Appointment details saved.");
      router.replace(`/appointments/payment?appointmentId=${appointmentId}`);
    } else {
      toast.error(res.message || "Failed to save appointment details.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setValue("patientType", "MYSELF", { shouldValidate: true })
            }
            className={cn(
              "h-10 rounded-md border text-sm font-medium",
              patientType === "MYSELF"
                ? "border-blue-500 bg-blue-50 text-gray-900"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            {t("myself")}
          </button>{" "}
          <button
            type="button"
            onClick={() =>
              setValue("patientType", "SOMEONE_ELSE", { shouldValidate: true })
            }
            className={cn(
              "h-10 rounded-md border text-sm font-medium",
              patientType === "SOMEONE_ELSE"
                ? "border-blue-500 bg-blue-50 text-gray-900"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            他人
          </button>
        </div>
      </div>

      {/* SOMEONE_ELSE extra fields */}
      {patientType === "SOMEONE_ELSE" && (
        <div className="mb-4 space-y-4">
          {/* Relationship */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              {t("relationship")}
            </label>
            <div className="relative">
              <select
                {...register("relationship")}
                className={cn(
                  "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
                  errors.relationship ? "border-red-500" : "border-gray-200",
                )}
                defaultValue={defaultValues.relationship ?? ""}
              >
                <option value="" disabled>
                  {t("selectRelationship")}
                </option>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <FieldError message={errors.relationship?.message} />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              {t("patientFullName")}
            </label>
            <input
              {...register("fullName")}
              className={cn(
                "h-10 w-full rounded-md border px-3 text-sm outline-none",
                errors.fullName ? "border-red-500" : "border-gray-200",
              )}
              placeholder={t("enterFullName")}
            />
            <FieldError message={errors.fullName?.message} />
          </div>

          {/* Date of Birth of Patient */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              {t("dateOfBirthPatient")}
            </label>
            <div className="rounded-md border border-gray-200 p-3">
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field }) => {
                  let parsed: Date | undefined;
                  if (field.value) {
                    const parts = field.value.split("/");
                    if (parts.length === 3) {
                      const d = parseInt(parts[0], 10);
                      const m = parseInt(parts[1], 10);
                      const y = parseInt(parts[2], 10);
                      const date = new Date(y, m - 1, d);
                      parsed =
                        !isNaN(date.getTime()) &&
                        date.getDate() === d &&
                        date.getMonth() === m - 1
                          ? date
                          : undefined;
                    }
                  }
                  const selectedDate =
                    parsed && !Number.isNaN(parsed.getTime())
                      ? parsed
                      : undefined;

                  return (
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      defaultMonth={selectedDate ?? new Date()}
                      onSelect={(day) => {
                        const formatted = day ? format(day, "dd/MM/yyyy") : "";
                        field.onChange(formatted);
                        setValue("dateOfBirth", formatted, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                      disabled={{ after: new Date() }}
                    />
                  );
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">生日</p>
            <FieldError message={errors.dateOfBirth?.message} />
          </div>
        </div>
      )}

      {/* MYSELF fields */}
      {patientType === "MYSELF" && (
        <div className="mb-4 space-y-4">
          {/* Full Name */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              全名
            </label>
            <div className="relative">
              <input
                {...register("fullName")}
                className={cn(
                  "h-10 w-full rounded-md border bg-blue-50 px-3 pr-10 text-sm outline-none",
                  errors.fullName ? "border-red-500" : "border-gray-200",
                )}
                readOnly
              />
              <button
                type="button"
                onClick={() => {
                  if (!appointmentData.appointmentId) return;
                  const returnTo = `/appointments/patient-details?appointmentId=${appointmentData.appointmentId}`;
                  const url = new URLSearchParams({
                    appointmentId: appointmentData.appointmentId,
                    returnTo,
                  });
                  router.push(`/user/profile?${url.toString()}`);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Edit profile"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              如需更新您的姓名，请访问您的个人资料。
            </p>
            <FieldError message={errors.fullName?.message} />
          </div>
        </div>
      )}

      {/* Email Address (readonly) */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          电子邮件地址
        </label>
        <input
          {...register("email")}
          className={cn(
            "h-10 w-full rounded-md border bg-blue-50 px-3 text-sm outline-none",
            errors.email ? "border-red-500" : "border-gray-200",
          )}
          readOnly
        />
        <FieldError message={errors.email?.message} />
      </div>

      {/* Primary Phone Number (readonly-ish + toggle) */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          主要电话号码
        </label>

        <div className="relative">
          <input
            className="h-10 w-full rounded-md border border-gray-200 bg-blue-50 px-3 pr-10 text-sm outline-none"
            value={patientDetails.phoneNumber}
            readOnly
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
            <Phone className="h-4 w-4" />
          </span>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            {...register("useAlternatePhone")}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span>为此次预约使用不同的电话号码</span>
        </label>

        {useAlternatePhone && (
          <div className="mt-3">
            <input
              {...register("phone")}
              className={cn(
                "h-10 w-full rounded-md border px-3 text-sm outline-none",
                errors.phone ? "border-red-500" : "border-gray-200",
              )}
              placeholder="Enter alternate phone number"
            />
            <FieldError message={errors.phone?.message} />
          </div>
        )}
      </div>

      {/* Reason for Visit */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          访问原因
        </label>
        <select
          {...register("reason")}
          className={cn(
            "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none",
            errors.reason ? "border-red-500" : "border-gray-200",
          )}
          defaultValue={defaultValues.reason || ""}
        >
          <option value="" disabled>
            选择理由
          </option>
          {REASON_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <FieldError message={errors.reason?.message} />
      </div>

      {/* Additional Notes */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          额外备注
        </label>
        <textarea
          {...register("notes")}
          className={cn(
            "min-h-[120px] w-full resize-none rounded-md border px-3 py-2 text-sm outline-none",
            errors.notes ? "border-red-500" : "border-gray-200",
          )}
          placeholder="添加有关您访问的任何其他信息"
        />
        <FieldError message={errors.notes?.message} />
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <button
          type="button"
          className="h-10 rounded-md border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => reset(defaultValues)}
          disabled={isSubmitting}
        >
          取消
        </button>

        <button
          type="submit"
          className="h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={isSubmitting}
        >
          {t("continueToPayment")}
        </button>
      </div>
    </form>
  );
}
