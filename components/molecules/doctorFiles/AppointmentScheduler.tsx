"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useAppointmentSlots } from "@/hooks/useAppointmentSlots";
import { useAppointmentReservation } from "@/hooks/useAppointmentReservation";
import { useTranslations } from "@/hooks/useTranslations";
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  isSunday,
  isBefore,
  startOfDay,
  isAfter,
} from "date-fns";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentSchedulerProps {
  doctorId: string;
  userId?: string;
}

export default function AppointmentScheduler({
  doctorId,
  userId,
}: AppointmentSchedulerProps) {
  const t = useTranslations("doctors");
  const {
    date,
    setDate,
    timeSlots,
    initialTimeSlot,
    isLoading,
    fetchSlotsForDate,
  } = useAppointmentSlots(doctorId, userId);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const { mutate: reserveAppointment, isPending } = useAppointmentReservation({
    userId,
    onConflict: () => {
      setSelectedSlot(null);
      if (date) fetchSlotsForDate(date);
    },
  });
  const formatDateYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Initialize selected slot when initialTimeSlot is available
  useEffect(() => {
    if (initialTimeSlot) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSlot(initialTimeSlot);
    }
  }, [initialTimeSlot]);

  // Sync internal month state when date changes (e.g. initial load)
  useEffect(() => {
    if (date) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentMonth(date);
    }
  }, [date]);

  const handleReservation = () => {
    if (!date || !selectedSlot) return;

    const slot = timeSlots.find((s) => s.startTime === selectedSlot);
    if (!slot) return; // slots 可能刷新过，兜底一下

    reserveAppointment({
      doctorId,
      date: formatDateYYYYMMDD(date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      // 如果 payload 里未来要带 doctorName/doctorSpecialty，这里也可以加
    });
  };

  const today = startOfDay(new Date());
  const maxDate = endOfMonth(addMonths(today, 2));

  // Date disabled logic: Sundays, past dates, or dates after maxDate
  const isDateDisabled = (day: Date) => {
    return isSunday(day) || isBefore(day, today) || isAfter(day, maxDate);
  };
  //如果是新选择的日期，更新日期并获取该日期的时间段
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      fetchSlotsForDate(newDate);
      setSelectedSlot(null); // Reset slot selection when date changes
    }
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);

    // 当导航到不同的月份时，默认选择第一个可用的日期
    // 找到新月份中第一个可选择的日期
    let firstSelectableDay = startOfMonth(month);

    // 如果月份是当前月份，则不应选择过去的日期
    if (isBefore(firstSelectableDay, today)) {
      firstSelectableDay = today;
    }

    // If it's a Sunday, move to Monday
    while (isSunday(firstSelectableDay)) {
      firstSelectableDay = new Date(
        firstSelectableDay.setDate(firstSelectableDay.getDate() + 1),
      );
    }

    // 更新日期并获取该日期的时间段
    if (!isAfter(firstSelectableDay, maxDate)) {
      setDate(firstSelectableDay);
      fetchSlotsForDate(firstSelectableDay);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-gray-100">
        {t("scheduleAppointment")}
      </h2>

      {/* Calendar */}
      <div className="mb-6 flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={isDateDisabled}
          month={currentMonth}
          onMonthChange={handleMonthChange}
          className="rounded-md border shadow-sm dark:border-gray-700"
          classNames={{
            day_selected:
              "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
            day_today:
              "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
          }}
        />
      </div>

      {/* Slots Section */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t("availableTimeSlots")}
        </h3>

        {isLoading ? (
          <div className="flex h-20 w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        ) : timeSlots.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((slot) => {
              const [hours, minutes] = slot.startTime.split(":");
              const h = parseInt(hours, 10);
              const ampm = h >= 12 ? "PM" : "AM";
              const h12 = h % 12 || 12;
              const formattedTime = `${h12
                .toString()
                .padStart(2, "0")}:${minutes} ${ampm}`;

              return (
                <Button
                  key={slot.startTime}
                  variant="outline"
                  className={cn(
                    "w-full justify-center text-sm font-medium",
                    selectedSlot === slot.startTime
                      ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100",
                  )}
                  onClick={() => setSelectedSlot(slot.startTime)}
                >
                  {formattedTime}
                </Button>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 py-4 dark:text-gray-400">
            {t("noSlotsAvailable")}
          </p>
        )}
      </div>

      <Button
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-11 dark:bg-blue-600 dark:hover:bg-blue-700"
        onClick={handleReservation}
        disabled={!selectedSlot || isLoading || isPending}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("reserving")}
          </span>
        ) : (
          t("continueToNextStep")
        )}
      </Button>
    </div>
  );
}
