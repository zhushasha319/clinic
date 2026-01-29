import { DepartmentsSectionClient } from "@/components/organisms/departments-section-client";
import { departmentData } from "@/db/door";
import { getOurDoctors } from "@/lib/actions/doctor.actions";
import { DoctorSummary } from "@/types";
import { getTranslations } from "next-intl/server";

interface DepartmentsSectionProps {
  className?: string;
}

export async function DepartmentsSection({
  className,
}: DepartmentsSectionProps) {
  const t = await getTranslations("common");
  let doctors: DoctorSummary[] = [];
  let doctorsError: string | null = null;

  try {
    const response = await getOurDoctors();
    if (response.success && response.data) {
      doctors = response.data;
    } else {
      doctorsError = response.message || "Failed to load doctors";
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An Unknown error occured";
    doctorsError = message;
  }

  return (
    <section className={className}>
      <DepartmentsSectionClient
        title={t("ourDepartments")}
        departments={departmentData}
        doctors={doctors}
        doctorsError={doctorsError}
      />
    </section>
  );
}
