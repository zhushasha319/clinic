import { useState, useEffect, useCallback } from "react";
import { getAppTimeZone } from "@/lib/config";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import {
  getAvailableDoctorSlots,
  getPendingAppointmentForDoctor,
} from "@/lib/actions/doctor.actions";
import { TimeSlot } from "@/types";
import { toast } from "react-hot-toast";

export const useAppointmentSlots = (doctorId: string, userId?: string) => {
  // 状态
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [initialTimeSlot, setInitialTimeSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const timeZone = getAppTimeZone();

  // 根据应用时区生成给 API 用的日期字符串
  const getFormattedDate = (d: Date) =>
    formatInTimeZone(d, timeZone, "yyyy-MM-dd");

  // 拉取号源的函数
  const fetchSlotsForDate = useCallback(
    async (targetDate: Date) => {
      setIsLoading(true);
      try {
        const formattedDate = getFormattedDate(targetDate);
        const response = await getAvailableDoctorSlots({
          doctorId,
          date: formattedDate,
          currentUserId: userId,
        });

        if (response.success && response.data) {
          setTimeSlots(response.data);
        } else {
          toast.error(response.message || "加载号源失败");
          setTimeSlots([]);
        }
      } catch (error) {
        console.error("拉取号源出错:", error);
        toast.error("加载号源时发生错误");
        setTimeSlots([]);
      } finally {
        setIsLoading(false);
      }
    },
    [doctorId, userId]
  );

  // 初始加载 effect
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setIsLoading(true);

      try {
        let effectiveDate = new Date(); // 默认取本地当前时间
        // 最好把“现在”转换为应用时区，确保“今天”的判断准确
        const nowZoned = toZonedTime(new Date(), timeZone);
        effectiveDate = nowZoned;

        let pendingSlotTime: string | null = null;
        let pendingDate: Date | null = null;

        // 1. 有用户时检查是否有待支付预约
        if (userId) {
          const pendingRes = await getPendingAppointmentForDoctor({
            userId,
            doctorId,
          });

          if (
            pendingRes.success &&
            pendingRes.data &&
            pendingRes.data.appointment
          ) {
            const { date: pendingDateString, startTime } =
              pendingRes.data.appointment;

            // 将日期字符串(YYYY-MM-DD)解析回 Date
            // 如果严格是 YYYY-MM-DD，可直接 new Date(pendingDateString)
            pendingDate = new Date(pendingDateString);
            pendingSlotTime = startTime;
          }
        }

        if (!isMounted) return;

        // 2. 确定最终日期和初始时间段
        if (pendingDate && pendingSlotTime) {
          effectiveDate = pendingDate;
          setInitialTimeSlot(pendingSlotTime);
        } else {
          setInitialTimeSlot(null);
        }

        // 3. 设置日期状态并拉取号源
        setDate(effectiveDate);
        await fetchSlotsForDate(effectiveDate);
      } catch (error) {
        console.error("初始化出错:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [doctorId, userId, fetchSlotsForDate]);

  return {
    date,
    setDate,
    timeSlots,
    initialTimeSlot,
    isLoading,
    fetchSlotsForDate,
  };
};
