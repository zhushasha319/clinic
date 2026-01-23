"use client";
// 预约挂号的 hook，返回一个 mutate 方法用于发起预约请求
//useAppointmentReservation 把 userId 放在 hook 层、把医生和时间放在 mutate 里，
//是为了区分「用户上下文-贯穿的」和「一次具体操作的参数-每次可变的」，让这个 hook 可复用、可测试、也更贴近真实业务建模。
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
  const [isPending, startTransition] = useTransition(); //用来处理不那么紧急的需求
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
          toast.success(res.message ?? "Reservation created.");

          // 构建跳转 URL
          const appointmentId = res.data?.appointmentId as string | undefined;
          if (!appointmentId) {
            // 理论上不该发生：success=true 但没 appointmentId
            toast.error("Missing appointmentId from server response.");
            return;
          }

          const params = new URLSearchParams({ appointmentId });

          // guest 预约需要带 guestIdentifier
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const guestIdentifier = (res.data as any)?.guestIdentifier;

          if (!userId && guestIdentifier) {
            params.set("guestIdentifier", guestIdentifier);
          }

          router.push(`/appointments/patient-details?${params.toString()}`);
          return;
        }

        // success: false
        toast.error(res?.error || res?.message || "Failed to reserve slot.");

        // 规范里要求：errorType === "slotUnavailable" 时触发冲突回调
        const et = res?.errorType;
        if (et === "slotUnavailable" || et === "SLOT_UNAVAILABLE") {
          onConflict();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        toast.error(e?.message ?? "Something went wrong.");
      }
    });
  };

  return {
    mutate,
    isPending,
  };
};
//使用方法：const { mutate, isPending } = useAppointmentReservation({ userId, onConflict });
//调用 mutate({ doctorId, date, startTime, endTime }) 发起预约请求
