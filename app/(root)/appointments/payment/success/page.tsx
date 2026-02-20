import { auth } from "@/auth";
import db from "@/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getAppTimeZone } from "@/lib/config";
import { getTranslations } from "next-intl/server";
import { AppointmentStatus } from "@/lib/generated/prisma";
import {
  DEFAULT_APPOINTMENT_FEE,
  upsertCompletedTransaction,
} from "@/lib/payment/transaction-ledger";

interface PageProps {
  searchParams: Promise<{
    appointmentId?: string;
    method?: string;
    test?: string;
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const t = await getTranslations("payment.success");
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  let appointmentId = params.appointmentId;

  // 如果没有 appointmentId,查找用户最近的已支付预约
  if (!appointmentId) {
    const recentAppointment = await db.appointment.findFirst({
      where: {
        OR: [{ userId: session.user.id }, { guestIdentifier: session.user.id }],
        paymentStatus: "PAID",
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!recentAppointment) {
      redirect("/");
    }

    appointmentId = recentAppointment.appointmentId;
  }

  // 获取预约信息
  let appointment = await db.appointment.findUnique({
    where: { appointmentId: appointmentId },
    include: {
      doctor: true,
    },
  });

  if (!appointment) {
    redirect("/");
  }

  // 验证访问权限
  const isOwner = appointment.userId === session.user.id;
  const isGuest = appointment.guestIdentifier === session.user.id;

  if (!isOwner && !isGuest) {
    redirect("/");
  }

  // 测试模式: 模拟支付成功,更新数据库
  if (params.test === "true" && appointment.paymentStatus !== "PAID") {
    const updatedAppointment = await db.appointment.update({
      where: { appointmentId: appointmentId },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "ALIPAY",
        paymentCompletedAt: new Date(),
        status: AppointmentStatus.BOOKING_CONFIRMED,
        reservationExpiresAt: null,
      },
    });

    await upsertCompletedTransaction({
      appointmentId: updatedAppointment.appointmentId,
      doctorId: updatedAppointment.doctorId,
      paymentGateway: "ALIPAY",
      gatewayTransactionId: `test-alipay-${updatedAppointment.appointmentId}`,
      amount: DEFAULT_APPOINTMENT_FEE,
      notes: "Simulated payment success in test mode.",
      paymentDetails: { source: "payment-success-test-mode" },
    });

    // HTTP 模式不支持事务；单独查询一次获取完整数据。
    appointment = await db.appointment.findUnique({
      where: { appointmentId: appointmentId },
      include: {
        doctor: true,
      },
    });

    if (!appointment) {
      redirect("/");
    }
  }

  // 格式化日期和时间
  const tz = getAppTimeZone();
  const startZoned = toZonedTime(appointment.appointmentStartUTC, tz);
  const appointmentDate = format(startZoned, "yyyy年MM月dd日");
  const appointmentTime = format(startZoned, "HH:mm");
  const paymentMethod = params.method;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              {paymentMethod === "cash" ? t("cashTitle") : t("title")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {paymentMethod === "cash" ? t("cashMessage") : t("message")}
            </p>

            <div className="w-full bg-muted rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold mb-4">{t("appointmentDetails")}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{`${t("appointmentId")}:`}</span>
                  <span className="font-medium">
                    {appointment.appointmentId.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{`${t("doctor")}:`}</span>
                  <span className="font-medium">{appointment.doctor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{`${t("date")}:`}</span>
                  <span className="font-medium">{appointmentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{`${t("time")}:`}</span>
                  <span className="font-medium">{appointmentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{`${t("paymentMethod")}:`}</span>
                  <span className="font-medium">
                    {paymentMethod === "cash" ? t("cash") : t("alipay")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button asChild className="flex-1" variant="outline">
                <Link href="/">{t("backToHome")}</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/user/profile">{t("viewMyAppointments")}</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
