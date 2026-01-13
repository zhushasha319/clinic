"use server";
import { ServerActionResponse, DoctorSummary, DoctorReview } from "@/types";
import prisma from "@/db/prisma";
import { Role } from "@/lib/generated/prisma";
import {getAppTimeZone from "@/lib/config";
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
    const { APPLICATION_TIMEZONE } = await import("@/lib/constanse");

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
      (testimonial) => {
        // Convert UTC date to application timezone
        const zonedDate = toZonedTime(
          testimonial.createdAt,
          APPLICATION_TIMEZONE
        );
        const formattedDate = format(zonedDate, "MMM dd, yyyy", {
          timeZone: APPLICATION_TIMEZONE,
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
