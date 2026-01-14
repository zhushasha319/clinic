"use server";
import { ServerActionResponse, DoctorSummary, DoctorReview，DoctorDetails } from "@/types";
import prisma from "@/db/prisma";
import { Role } from "@/lib/generated/prisma";
import { getAppTimeZone } from "@/lib/config";

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
    if (!doctors) {
      return {
        success: true,
        data: [], // Return empty array if no doctors found
      };
    }

    // Map the fetched data to the DoctorSummary structure.
    const formattedDoctors: DoctorSummary[] = doctors.map((doc) => ({
      id: doc.id,
      name: doc.name,
      imageUrl: doc.image,
      specialty: doc.doctorProfile?.specialty ?? "N/A",
      rating: doc.doctorProfile?.rating ?? 0,
      reviewCount: doc.doctorProfile?.reviewCount ?? 0,
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
"use server";

import { prisma } from "@/lib/prisma"; // adjust if your prisma client is exported elsewhere
import type { DoctorDetails, ServerActionResponse } from "@/types";

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
