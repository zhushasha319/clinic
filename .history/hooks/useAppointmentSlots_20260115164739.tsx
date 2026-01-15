import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { getAppTimeZone } from "@/lib/config";
import { toZonedTime } from "date-fns-tz";
import {
  getAvailableDoctorSlots,
  getPendingAppointmentForDoctor,
} from "@/lib/actions/doctor.actions";
import { TimeSlot } from "@/types";
import { toast } from "react-hot-toast";

export const useAppointmentSlots = (doctorId: string, userId?: string) => {
  // State
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [initialTimeSlot, setInitialTimeSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to get formatted date string for API
  const getFormattedDate = (d: Date) => format(d, "yyyy-MM-dd");

  // Fetch slots function
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
          toast.error(response.message || "Failed to load time slots");
          setTimeSlots([]);
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast.error("An error occurred while loading slots");
        setTimeSlots([]);
      } finally {
        setIsLoading(false);
      }
    },
    [doctorId, userId]
  );

  // Initial load effect
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setIsLoading(true);

      try {
        let effectiveDate = new Date(); // Default roughly to now/local
        // Ideally convert "now" to app timezone to be precise about "today"
        const tz = getAppTimeZone();
        const nowZoned = toZonedTime(new Date(), tz);
        effectiveDate = nowZoned;

        let pendingSlotTime: string | null = null;
        let pendingDate: Date | null = null;

        // 1. Check for pending appointment if user exists
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

            // Parse the date string (YYYY-MM-DD) back to a Date object
            // We can just use new Date(pendingDateString) if it's strictly YYYY-MM-DD
            pendingDate = new Date(pendingDateString);
            pendingSlotTime = startTime;
          }
        }

        if (!isMounted) return;

        // 2. Determine effective date and initial slot
        if (pendingDate && pendingSlotTime) {
          effectiveDate = pendingDate;
          setInitialTimeSlot(pendingSlotTime);
        } else {
          setInitialTimeSlot(null);
        }

        // 3. Set the date state and fetch slots
        setDate(effectiveDate);
        await fetchSlotsForDate(effectiveDate);
      } catch (error) {
        console.error("Initialization error:", error);
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
