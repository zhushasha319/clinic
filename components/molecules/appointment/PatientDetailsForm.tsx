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
  "普通咨询",
  "复诊",
  "处方续开",
  "化验结果",
  "心内科咨询",
  "其他",
];

const RELATIONSHIP_OPTIONS = [
  "父母",
  "子女",
  "配偶",
  "兄弟姐妹",
  "亲属",
  "朋友",
  "照护者",
  "其他",
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
    // 规则要求日期字符串格式 DD/MM/YYYY
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

    // 对于 MYSELF：始终使用最新的 patientDetails.name
    // 对于 SOMEONE_ELSE：使用 appointmentData.patientName（“他人”的名字）
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
      dateOfBirth: dobFromAppointment, // 仅在 SOMEONE_ELSE 时使用/必填
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

  // 若 appointmentData 变化（少见但可能），同步表单
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
        toast.error("服务端返回缺少 appointmentId。");
        return;
      }
      toast.success(res.message || "预约信息已保存。");
      const params = new URLSearchParams({ appointmentId });
      if (appointmentData.guestIdentifier) {
        params.set("guestIdentifier", appointmentData.guestIdentifier);
      }
      router.replace(`/appointments/payment?${params.toString()}`);
    } else {
      toast.error(res.message || "保存预约信息失败。");
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
            {t("someoneElse")}
          </button>
        </div>
      </div>

      {/* SOMEONE_ELSE 额外字段 */}
      {patientType === "SOMEONE_ELSE" && (
        <div className="mb-4 space-y-4">
          {/* 关系 */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              {t("relationship")}
            </label>
            <div className="亲属">
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

          {/* 患者生日 */}
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
            <p className="mt-1 text-xs text-gray-500">{t("dateOfBirthHelpText")}</p>
            <FieldError message={errors.dateOfBirth?.message} />
          </div>
        </div>
      )}

      {/* MYSELF 字段 */}
      {patientType === "MYSELF" && (
        <div className="mb-4 space-y-4">
          {/* 全名 */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-700">
              {t("fullName")}
            </label>
            <div className="亲属">
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
                aria-label="编辑资料"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t("toChangeNameEditProfile")}
            </p>
            <FieldError message={errors.fullName?.message} />
          </div>
        </div>
      )}

      {/* 邮箱地址（只读） */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          {t("emailAddress")}
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

      {/* 主手机号（只读 + 可切换） */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          {t("primaryPhoneNumber")}
        </label>

        <div className="亲属">
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
          <span>{t("useAlternatePhoneNumber")}</span>
        </label>

        {useAlternatePhone && (
          <div className="mt-3">
            <input
              {...register("phone")}
              className={cn(
                "h-10 w-full rounded-md border px-3 text-sm outline-none",
                errors.phone ? "border-red-500" : "border-gray-200",
              )}
              placeholder="请输入备用手机号"
            />
            <FieldError message={errors.phone?.message} />
          </div>
        )}
      </div>

      {/* 就诊原因 */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          {t("reasonForVisit")}
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
            {t("selectReason")}
          </option>
          {REASON_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <FieldError message={errors.reason?.message} />
      </div>

      {/* 额外备注 */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          {t("additionalNotes")}
        </label>
        <textarea
          {...register("notes")}
          className={cn(
            "min-h-[120px] w-full resize-none rounded-md border px-3 py-2 text-sm outline-none",
            errors.notes ? "border-red-500" : "border-gray-200",
          )}
          placeholder={t("additionalNotesPlaceholder")}
        />
        <FieldError message={errors.notes?.message} />
      </div>

      {/* 底部按钮 */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <button
          type="button"
          className="h-10 rounded-md border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => reset(defaultValues)}
          disabled={isSubmitting}
        >
          {t("reset")}
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

