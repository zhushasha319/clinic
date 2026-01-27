"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { paymentData } from "@/types";
import BookingSteps from "@/components/molecules/appointment/BookingSteps";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2 } from "lucide-react";
import { format, parse } from "date-fns";
import toast from "react-hot-toast";
import { useTranslations } from "@/hooks/useTranslations";
import {
  confirmCashAppointment,
  createAlipayPayment,
} from "@/lib/actions/appointment/payment.action";
type PaymentMethod = "cash" | "alipay";

interface PaymentDetailsClientProps {
  initialAppointmentData: paymentData;
}

function AlipayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.5 14.25c-1.65.66-3.55 1.04-5.5 1.04-1.95 0-3.85-.38-5.5-1.04v-.5c0-1.93 3.13-3.5 7-3.5s7 1.57 7 3.5v.5zM12 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
    </svg>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-blue-50 p-5 dark:bg-blue-900">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function PaymentOption({
  value,
  title,
  icon,
  checked,
}: {
  value: string;
  title: string;
  icon: React.ReactNode;
  checked: boolean;
}) {
  return (
    <label
      htmlFor={value}
      className={[
        "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
        checked ? "bg-blue-50" : "bg-background hover:bg-muted/20",
      ].join(" ")}
    >
      <RadioGroupItem id={value} value={value} />
      <div className="flex items-center gap-2 text-sm font-medium ">
        <span className="text-muted-foreground ">{icon}</span>
        <span>{title}</span>
      </div>
    </label>
  );
}

export default function PaymentDetailsClient({
  initialAppointmentData,
}: PaymentDetailsClientProps) {
  const router = useRouter();
  const [method, setMethod] = React.useState<PaymentMethod>("alipay");
  const [agreed, setAgreed] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const t = useTranslations("payment");

  // 解构数据
  const {
    appointmentId,
    doctorName,
    doctorSpecilaity,
    date,
    timeSlot,
    patientType,
    patientName,
    patientdateofbirth,
    patientEmail,
    phoneNumber,
    reasonForVisit,
    additionalNotes,
    relationship,
    fee,
    userId,
  } = initialAppointmentData;

  // Format date and time
  const formattedDateTime = React.useMemo(() => {
    try {
      const dateStr = `${date} ${timeSlot}`;
      const parsedDate = parse(dateStr, "yyyy-MM-dd HH:mm");
      return format(parsedDate, "MMMM dd, yyyy 'at' HH:mm");
    } catch {
      return `${date} at ${timeSlot}`;
    }
  }, [date, timeSlot]);

  // Format patient date of birth
  const formattedDOB = React.useMemo(() => {
    if (patientType === "MYSELF") {
      return patientEmail || "N/A";
    }
    if (patientdateofbirth) {
      try {
        const dateObj = new Date(patientdateofbirth);
        return format(dateObj, "MM/dd/yyyy");
      } catch {
        return "N/A";
      }
    }
    return "N/A";
  }, [patientType, patientdateofbirth, patientEmail]);

  // Get patient name
  const displayPatientName = patientName || "N/A";

  // Get patient phone
  const displayPatientPhone = phoneNumber || "N/A";

  // 处理支付
  async function handlePayment() {
    if (!agreed) {
      toast.error(t("pleaseAgreeTerms"));
      return;
    }

    setIsProcessing(true);

    try {
      // 如果是现金支付,确认现金支付方式
      if (method === "cash") {
        const result = await confirmCashAppointment(appointmentId);

        if (!result.success) {
          throw new Error(result.message || t("success.cashMessage"));
        }

        toast.success(t("success.cashMessage"));
        router.push(
          `/appointments/payment/success?appointmentId=${appointmentId}&method=cash`,
        );
        return;
      }

      // 支付宝支付流程 - 使用 server action
      const result = await createAlipayPayment({
        appointmentId,
        amount: fee,
        userId: userId, // 使用正确的用户ID
        clientIp: "", // 客户端IP可以为空,服务端会使用默认值
      });

      if (!result.success) {
        throw new Error(result.error || "创建支付失败");
      }

      // 获取支付凭据
      const charge = result.data?.charge;

      // 检查是否是测试环境 (livemode: false)
      if (charge?.livemode === false) {
        // 测试环境: 模拟支付成功,直接跳转到成功页面
        console.log("测试环境: 模拟支付成功");
        toast.success("测试环境: 模拟支付成功");
        router.push(
          `/appointments/payment/success?appointmentId=${appointmentId}&method=alipay&test=true`,
        );
        return;
      }

      // 生产环境: 跳转支付宝H5支付
      if (charge?.credential?.alipay_wap) {
        const alipayData = charge.credential.alipay_wap;

        // alipay_wap 返回的是一个对象,需要构建完整的支付宝网关URL
        if (typeof alipayData === "object" && alipayData.channel_url) {
          // 构建查询参数
          const params = new URLSearchParams();
          Object.entries(alipayData).forEach(([key, value]) => {
            if (
              key !== "channel_url" &&
              value !== undefined &&
              value !== null
            ) {
              params.append(key, String(value));
            }
          });

          const paymentUrl = `${alipayData.channel_url}?${params.toString()}`;
          console.log("Redirecting to Alipay:", paymentUrl);
          window.location.href = paymentUrl;
        } else if (typeof alipayData === "string") {
          // 如果直接返回的是URL字符串
          window.location.href = alipayData;
        } else {
          throw new Error("支付凭据格式无效");
        }
      } else {
        throw new Error("未获取到支付凭据");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("支付失败:", error);
      toast.error(error.message || t("processing"));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleEditDetail() {
    router.push(`/appointments/patient-details?appointmentId=${appointmentId}`);
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.replace("/doctors")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回医生页面
        </button>
      </div>

      {/* Booking Steps */}
      <div className="mb-6">
        <BookingSteps currentStep={3} />
      </div>

      {/* Payment Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-6 p-6">
            {/* Appointment Details */}
            <Section title={t("appointmentDetails")}>
              <InfoRow label={`${t("dateTime")}:`} value={formattedDateTime} />
              <InfoRow label={`${t("doctor")}:`} value={doctorName} />
              <InfoRow label={`${t("specialty")}:`} value={doctorSpecilaity} />
              <InfoRow
                label={`${t("reason")}:`}
                value={reasonForVisit || "N/A"}
              />
            </Section>

            {/* Patient Information */}
            <Section title={t("patientInfo")}>
              <InfoRow label={`${t("name")}:`} value={displayPatientName} />
              <InfoRow label={`${t("dateOfBirth")}:`} value={formattedDOB} />
              <InfoRow label={`${t("email")}:`} value={patientEmail || "N/A"} />
              <InfoRow label={`${t("phone")}:`} value={displayPatientPhone} />
              {patientType === "SOMEONE_ELSE" && relationship && (
                <InfoRow label={`${t("relationship")}:`} value={relationship} />
              )}
            </Section>

            {/* Additional Notes */}
            {additionalNotes && (
              <Section title={t("additionalNotes")}>
                <p className="text-sm text-muted-foreground">
                  {additionalNotes}
                </p>
              </Section>
            )}

            {/* Payment Details */}
            <Section title={t("paymentDetails")}>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t("consultationFee")}</span>
                  <span>${fee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{t("total")}</span>
                  <span>${fee.toFixed(2)}</span>
                </div>
              </div>
            </Section>

            {/* Select Payment Method */}
            <div className="space-y-3">
              <div className="text-sm font-semibold">
                {t("selectPaymentMethod")}
              </div>

              <RadioGroup
                value={method}
                onValueChange={(v) => setMethod(v as PaymentMethod)}
                className="space-y-3"
              >
                {/* Cash */}
                <PaymentOption
                  checked={method === "cash"}
                  value="cash"
                  title={t("cashAtCounter")}
                  icon={<DollarSign className="h-4 w-4" />}
                />

                {/* Alipay */}
                <PaymentOption
                  checked={method === "alipay"}
                  value="alipay"
                  title={t("alipay")}
                  icon={<AlipayIcon className="h-4 w-4" />}
                />
              </RadioGroup>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(Boolean(v))}
                />
                <label
                  htmlFor="terms"
                  className="text-xs leading-5 text-muted-foreground"
                >
                  {t("termsAgree")}
                </label>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gray-200" />

          {/* Bottom actions */}
          <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleEditDetail}
            >
              {t("editDetails")}
            </Button>

            <div className="flex w-full flex-col items-end gap-3 sm:w-auto">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {t("total")}
                </div>
                <div className="text-lg font-semibold">${fee.toFixed(2)}</div>
              </div>

              <Button
                className="w-full sm:w-[320px] bg-yellow-400 hover:bg-yellow-500 text-blue-600 font-semibold"
                disabled={!agreed || isProcessing}
                onClick={handlePayment}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("processing")}
                  </>
                ) : method === "alipay" ? (
                  t("payNow")
                ) : (
                  t("payAtCounter")
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
