'use client'

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useAppointmentSlots } from "@/hooks/useAppointmentSlots";
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
  userRole?: string;
}

export default function AppointmentScheduler({
  doctorId,
  userId,
  userRole,
}: AppointmentSchedulerProps) {
  const {
    date,
    setDate,
    timeSlots,
    initialTimeSlot,
    isLoading,
    fetchSlotsForDate,
  } = useAppointmentSlots(doctorId, userId);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Track the currently displayed month in the calendar to handle month navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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
    alert(
      `Reservation requested for ${date.toDateString()} at ${selectedSlot}`
    );
  };

  const today = startOfDay(new Date());
  const maxDate = endOfMonth(addMonths(today, 2));

  // Date disabled logic: Sundays, past dates, or dates after maxDate
  const isDateDisabled = (day: Date) => {
    return isSunday(day) || isBefore(day, today) || isAfter(day, maxDate);
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      fetchSlotsForDate(newDate);
      setSelectedSlot(null); // Reset slot selection when date changes
    }
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);

    // When navigating to a differnt month, select the first available day by default
    // Find the first selectable day in the new month
    let firstSelectableDay = startOfMonth(month);

    // If the month is the current month, we shouldn't select a past date
    if (isBefore(firstSelectableDay, today)) {
      firstSelectableDay = today;
    }

    // If it's a Sunday, move to Monday
    while (isSunday(firstSelectableDay)) {
      firstSelectableDay = new Date(
        firstSelectableDay.setDate(firstSelectableDay.getDate() + 1)
      );
    }

    // Update date and fetch slots
    if (!isAfter(firstSelectableDay, maxDate)) {
      setDate(firstSelectableDay);
      fetchSlotsForDate(firstSelectableDay);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-gray-900">
        Schedule Appointment
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
          className="rounded-md border shadow-sm"
          classNames={{
            day_selected:
              "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600",
            day_today: "bg-gray-100 text-gray-900",
          }}
        />
      </div>

      {/* Slots Section */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Available Time Slots
        </h3>

        {isLoading ? (
          <div className="flex h-20 w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : timeSlots.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((slot) => {
              // Assuming slot.startTime is "HH:mm" (24h) and we want "09:00 AM" format
              // Simple formatter for 12h display
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
                      ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => setSelectedSlot(slot.startTime)}
                >
                  {formattedTime}
                </Button>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 py-4">
            No slots available for this date.
          </p>
        )}
      </div>

      {/* Action Button */}
      <Button
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-11"
        onClick={handleReservation}
        disabled={!selectedSlot || isLoading}
      >
        Continue to Next Step
      </Button>
    </div>
  );
}
