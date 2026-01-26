import { DoctorCard } from "@/components/molecules/doctor-card";
import { getOurDoctors } from "@/lib/actions/doctor.actions";
import { DoctorSummary } from "@/types";
import { getTranslations } from "next-intl/server";

interface OurDoctorsProps {
  className?: string;
}

export async function OurDoctors({ className }: OurDoctorsProps) {
  let doctorsToDisplay: DoctorSummary[] = [];
  let fetchError: string | null = null;
  const t = await getTranslations("doctors");

  try {
    const response = await getOurDoctors();
    if (response.success && response.data) {
      doctorsToDisplay = response.data;
    } else {
      fetchError = response.message || t("errorLoading");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : t("errorLoading");
    fetchError = message;
  }
  return (
    <section className={className}>
      <div className="container mx-auto px-4 py-12">
        {/* Section Title */}
        <h2 className="text-2xl font-bold text-center mb-8">{t("title")}</h2>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {doctorsToDisplay
            .filter((doctor) => doctor.name !== null)
            .map((doctor) => (
              <DoctorCard
                key={doctor.id}
                id={doctor.id}
                name={doctor.name as string}
                specialty={doctor.specialty as string}
                rating={doctor.rating as number}
                reviewCount={doctor.reviewCount as number}
                image={doctor.imageUrl as string}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
