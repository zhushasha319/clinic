"use server";
import {
  ServerActionResponse,
  DoctorSummary,
  DoctorReview,
  DoctorDetails,
  TimeSlot,
} from "@/types";
import prisma from "@/db/prisma";
import { Role, AppointmentStatus, LeaveType } from "@/lib/generated/prisma";
import { getAppTimeZone } from "@/lib/config";
import { addMinutes } from "date-fns";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";

export async function getOurDoctors(): Promise<
  ServerActionResponse<DoctorSummary[]>
> {
  try {
    // Fetch users who have the DOCTOR role and an active profile.
    // We use `select` to efficiently query only the necessary fields.
    const doctors = await prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        doctorProfile: {
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        image: true, // This will be mapped to imageUrl
        doctorProfile: {
          select: {
            specialty: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: {
        // Optional: you can order the results, e.g., by rating or name
        doctorProfile: {
          rating: "desc",
        },
      },
    });

    // The `where` clause ensures `doctorProfile` is not null, but it's good practice to handle it safely.
    if (!doctors || doctors.length === 0) {
      return {
        success: true,
        data: [], // Return empty array if no doctors found
      };
    }

    const doctorIds = doctors.map((doc) => doc.id);
    const reviewAggregates = await prisma.doctorTestimonial.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: {
          in: doctorIds,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        testimonialId: true,
      },
    });

    const statsMap = new Map(
      reviewAggregates.map((stat) => [
        stat.doctorId,
        {
          averageRating: Number(stat._avg?.rating ?? 0),
          totalReviews: Number(stat._count?.testimonialId ?? 0),
        },
      ])
    );

    // Map the fetched data to the DoctorSummary structure.
    const formattedDoctors: DoctorSummary[] = doctors.map((doc) => ({
      id: doc.id,
      name: doc.name,
      imageUrl: doc.image,
      specialty: doc.doctorProfile?.specialty ?? "N/A",
      rating:
        statsMap.get(doc.id)?.averageRating ??
        Number(doc.doctorProfile?.rating ?? 0),
      reviewCount:
        statsMap.get(doc.id)?.totalReviews ??
        Number(doc.doctorProfile?.reviewCount ?? 0),
    }));

    // Return a success response with the formatted doctor data.
    return {
      success: true,
      data: formattedDoctors,
    };
  } catch (error) {
    // Log the detailed error for server-side debugging.
    console.error("Error fetching our doctors:", error);

    // Return a generic error response to the client.
    return {
      success: false,
      message:
        "An unexpected error occurred while fetching doctor information.",
      error: error instanceof Error ? error.message : String(error),
      errorType: "DatabaseError",
    };
  }
}

export async function getDoctorTestimonials(
  doctorId: string
): Promise<ServerActionResponse<DoctorReview[]>> {
  try {
    const { format, toZonedTime } = await import("date-fns-tz");

    // Fetch testimonials for the specified doctor
    const testimonials = await prisma.doctorTestimonial.findMany({
      where: {
        doctorId: doctorId,
      },
      select: {
        testimonialId: true,
        testimonialText: true,
        rating: true,
        createdAt: true,
        patient: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!testimonials || testimonials.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Map and format testimonials with timezone conversion
    const formattedTestimonials: DoctorReview[] = testimonials.map(
      (testimonial: (typeof testimonials)[0]) => {
        // Convert UTC date to application timezone
        const zonedDate = toZonedTime(testimonial.createdAt, getAppTimeZone());
        const formattedDate = format(zonedDate, "MMM dd, yyyy", {
          timeZone: getAppTimeZone(),
        });

        return {
          id: testimonial.testimonialId,
          rating: testimonial.rating ?? 0,
          reviewDate: formattedDate,
          testimonialText: testimonial.testimonialText,
          patientName: testimonial.patient.name ?? "Anonymous",
          patientImage: testimonial.patient.image,
        };
      }
    );

    return {
      success: true,
      data: formattedTestimonials,
    };
  } catch (error) {
    console.error("Error fetching doctor testimonials:", error);

    return {
      success: false,
      message: "An unexpected error occurred while fetching testimonials.",
      error: error instanceof Error ? error.message : String(error),
      errorType: "DatabaseError",
    };
  }
}

export async function getDoctorDetails(
  doctorId: string
): Promise<ServerActionResponse<DoctorDetails>> {
  try {
    if (!doctorId?.trim()) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "doctorId is required",
        message: "Invalid request",
      };
    }

    // We treat the Doctor's "id" in DoctorDetails as the User.id (doctor user id),
    // since DoctorProfile is keyed by userId and User holds name/image.
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        doctorProfile: {
          select: {
            credentials: true,
            specialty: true,
            rating: true,
            reviewCount: true,
            languages: true,
            specializations: true,
            brief: true,
            isActive: true,
          },
        },
      },
    });

    if (!doctor) {
      return {
        success: false,
        errorType: "NOT_FOUND",
        error: "Doctor not found",
        message: "Doctor not found",
      };
    }

    if (doctor.role !== "DOCTOR") {
      return {
        success: false,
        errorType: "NOT_A_DOCTOR",
        error: "User is not a doctor",
        message: "Requested user is not a doctor",
      };
    }

    if (!doctor.doctorProfile) {
      return {
        success: false,
        errorType: "PROFILE_MISSING",
        error: "Doctor profile not found",
        message: "Doctor profile not found",
      };
    }

    if (!doctor.doctorProfile.isActive) {
      return {
        success: false,
        errorType: "INACTIVE",
        error: "Doctor is not active",
        message: "Doctor is not currently active",
      };
    }

    const details: DoctorDetails = {
      id: doctor.id,
      name: doctor.name ?? "NO_NAME",
      image: doctor.image ?? null,
      credentials: doctor.doctorProfile.credentials,
      speciality: doctor.doctorProfile.specialty, // note: DoctorDetails uses "speciality"
      rating: Number(doctor.doctorProfile.rating ?? 0),
      reviewCount: Number(doctor.doctorProfile.reviewCount ?? 0),
      languages: doctor.doctorProfile.languages ?? [],
      specializations: doctor.doctorProfile.specializations ?? [],
      brief: doctor.doctorProfile.brief,
    };

    return {
      success: true,
      message: "Doctor details fetched successfully",
      data: details,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";

    return {
      success: false,
      errorType: "SERVER_ERROR",
      error: message,
      message: "Failed to fetch doctor details",
    };
  }
}

interface GetAvailableSlotsParams {
  doctorId: string;
  date: string; //format - YYYY - MM-DD
  currentUserId?: string;
}

export async function getAvailableDoctorSlots({
  doctorId,
  date,
  currentUserId,
}: GetAvailableSlotsParams): Promise<ServerActionResponse<TimeSlot[]>> {
  try {
    const timeZone = getAppTimeZone();

    // 1. Fetch App Settings
    const settings = await prisma.appSettings.findFirst();
    const slotsPerHour = settings?.slotsPerHour ?? 2;
    const startTimeConfig = settings?.startTime ?? "09:00";
    const endTimeConfig = settings?.endTime ?? "17:00";
    const slotDuration = 60 / slotsPerHour;

    // 2. Date Setup
    // Construct the ISO string for that date at 00:00:00
    // Then use fromZonedTime to get the UTC instant that represents 00:00 in that timezone.
    const startOfDayUTC = fromZonedTime(`${date} 00:00:00`, timeZone);

    // Now determine start and end times for slots in UTC relative to that day
    const workDayStartUTC = fromZonedTime(
      `${date} ${startTimeConfig}`,
      timeZone
    );
    const workDayEndUTC = fromZonedTime(`${date} ${endTimeConfig}`, timeZone);

    // 3. Generate Master List
    const allSlots: TimeSlot[] = [];
    let current = workDayStartUTC;

    while (current < workDayEndUTC) {
      const slotEnd = addMinutes(current, slotDuration);
      if (slotEnd > workDayEndUTC) break;

      allSlots.push({
        startTime: format(toZonedTime(current, timeZone), "HH:mm", {
          timeZone,
        }),
        endTime: format(toZonedTime(slotEnd, timeZone), "HH:mm", { timeZone }),
        startTimeUTC: current,
        endTimeUTC: slotEnd,
      });

      current = slotEnd;
    }

    // 4. Filter Availability

    // 4.1 Doctor Leave
    // Assuming leaveDate is stored as Date at UTC midnight for the given day or simple date string
    const leaveDate = new Date(date);

    const doctorLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        leaveDate: leaveDate,
      },
    });

    if (doctorLeave) {
      if (doctorLeave.leaveType === LeaveType.FULL_DAY) {
        return { success: true, data: [] };
      }

      // 13:00 in App Timezone converted to UTC
      const splitTimeUTC = fromZonedTime(`${date} 13:00:00`, timeZone);

      if (doctorLeave.leaveType === LeaveType.MORNING) {
        // Remove slots before 13:00
        const filtered = allSlots.filter(
          (slot) => slot.startTimeUTC >= splitTimeUTC
        );
        allSlots.length = 0;
        allSlots.push(...filtered);
      } else if (doctorLeave.leaveType === LeaveType.AFTERNOON) {
        // Remove slots after or at 13:00
        const filtered = allSlots.filter(
          (slot) => slot.startTimeUTC < splitTimeUTC
        );
        allSlots.length = 0;
        allSlots.push(...filtered);
      }
    }

    // 4.2 Existing Appointments
    const nextDayUTC = addMinutes(startOfDayUTC, 24 * 60);

    const dayAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentStartUTC: {
          gte: startOfDayUTC,
          lt: nextDayUTC,
        },
      },
    });

    const takenStartTimes = new Set<number>();
    const now = new Date();

    dayAppointments.forEach((appt) => {
      // Condition: Booked or Cash
      if (
        appt.status === AppointmentStatus.BOOKING_CONFIRMED ||
        appt.status === AppointmentStatus.CASH
      ) {
        takenStartTimes.add(appt.appointmentStartUTC.getTime());
      }
      // Condition: Pending & Future expiry & Not current user
      else if (appt.status === AppointmentStatus.PAYMENT_PENDING) {
        const isMyBooking = currentUserId && appt.userId === currentUserId;
        if (
          !isMyBooking &&
          appt.reservationExpiresAt &&
          appt.reservationExpiresAt > now
        ) {
          takenStartTimes.add(appt.appointmentStartUTC.getTime());
        }
      }
    });

    let availableSlots = allSlots.filter(
      (slot) => !takenStartTimes.has(slot.startTimeUTC.getTime())
    );

    // 4.3 Past Slots
    // Filter out any slots that are in the past relative to the current time.
    // This handles filtering 'today's' past slots and completely empties slots for past dates.
    availableSlots = availableSlots.filter((slot) => slot.startTimeUTC > now);

    return {
      success: true,
      data: availableSlots,
    };
  } catch (error) {
    console.error("Error getting available slots:", error);
    return {
      success: false,
      message: "Failed to get available slots",
      error: String(error),
    };
  }
}

interface PendingAppointmentParams {
  userId: string;
  doctorId: string;
}

interface PendingAppointmentData {
  appointment: {
    appointmentId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  } | null;
}

export async function getPendingAppointmentForDoctor({
  userId,
  doctorId,
}: PendingAppointmentParams): Promise<
  ServerActionResponse<PendingAppointmentData>
> {
  try {
    if (!userId?.trim() || !doctorId?.trim()) {
      return {
        success: false,
        errorType: "VALIDATION_ERROR",
        error: "Missing userId or doctorId",
        message: "Invalid request",
      };
    }

    const now = new Date();
    // Find the most recent pending appointment that has not expired
    const pendingAppt = await prisma.appointment.findFirst({
      where: {
        userId,
        doctorId,
        status: AppointmentStatus.PAYMENT_PENDING,
        // Ensure reservation is still valid
        reservationExpiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: "desc", // Get the latest one if multiple exist (though ideally shouldn't)
      },
    });

    if (!pendingAppt) {
      return {
        success: true,
        data: {
          appointment: null,
        },
      };
    }

    // Convert stored UTC times to App Timezone for display
    const timeZone = getAppTimeZone();
    const zonedStart = toZonedTime(pendingAppt.appointmentStartUTC, timeZone);
    const zonedEnd = toZonedTime(pendingAppt.appointmentEndUTC, timeZone);

    const dateStr = format(zonedStart, "yyyy-MM-dd", { timeZone });
    const startTimeStr = format(zonedStart, "HH:mm", { timeZone });
    const endTimeStr = format(zonedEnd, "HH:mm", { timeZone });

    return {
      success: true,
      data: {
        appointment: {
          appointmentId: pendingAppt.appointmentId,
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          status: pendingAppt.status,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching pending appointment:", error);
    return {
      success: false,
      message: "Failed to fetch pending appointment",
      error: String(error),
    };
  }
}
