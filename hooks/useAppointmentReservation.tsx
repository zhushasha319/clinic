"use client";
// 预约挂号的 hook，返回一个 mutate 方法用于发起预约请求
// useAppointmentReservation 把 userId 放在 hook 层，把医生和时间放在 mutate 里，
// 用于区分「用户上下文（贯穿）」与「一次操作参数（可变）」，便于复用与测试。
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  createGuestAppointment,
  createOrUpdateAppointmentReservation,
} from "@/lib/actions/appointment/appointment.action";

interface HookProps {
  userId?: string;
  onConflict: () => void;
}

interface ReservationPayload {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;

  doctorName?: string;
  doctorSpecialty?: string;
}

export const useAppointmentReservation = ({
  userId,
  onConflict,
}: HookProps) => {
  const [isPending, startTransition] = useTransition(); // 用来处理不那么紧急的任务
  const router = useRouter();

  const mutate = (payload: ReservationPayload) => {
    startTransition(async () => {
      try {
        // 决定调用哪个 server action
        const res = userId
          ? await createOrUpdateAppointmentReservation({
              doctorId: payload.doctorId,
              userId,
              date: payload.date,
              startTime: payload.startTime,
              endTime: payload.endTime,
            })
          : await createGuestAppointment({
              doctorId: payload.doctorId,
              date: payload.date,
              startTime: payload.startTime,
              endTime: payload.endTime,
            });

        if (res?.success) {
          toast.success(res.message ?? "预约已创建。");

          // 构建跳转 URL
          const appointmentId = res.data?.appointmentId as string | undefined;
          if (!appointmentId) {
            // 理论上不该发生：success=true 但没有 appointmentId
            toast.error("服务端返回缺少 appointmentId。");
            return;
          }

          router.push(`/appointments/patient-details?appointmentId=${appointmentId}`);
          return;
        }

        // 失败分支
        toast.error(res?.error || res?.message || "预约该时间段失败。");

        // 规范要求：errorType === "slotUnavailable" 时触发冲突回调
        const et = res?.errorType;
        if (et === "slotUnavailable" || et === "SLOT_UNAVAILABLE") {
          onConflict();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        toast.error(e?.message ?? "出现错误。");
      }
    });
  };

  return {
    mutate,
    isPending,
  };
};
// 使用方法：const { mutate, isPending } = useAppointmentReservation({ userId, onConflict });
// 调用 mutate({ doctorId, date, startTime, endTime }) 发起预约请求




