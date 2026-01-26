import { DepartmentCard } from "@/components/molecules/departmentCard";
import { getDepartments } from "@/lib/actions/settings.actions";
import { DepartmentData } from "@/types";
import { getTranslations } from "next-intl/server";

interface DepartmentsSectionProps {
  className?: string;
}

export async function DepartmentsSection({
  className,
}: DepartmentsSectionProps) {
  const t = await getTranslations("common");
  let departments: DepartmentData[] = [];
  let fetchError: string | null = null;
  try {
    const result = await getDepartments();
    if (result.success && result.data) {
      departments = result.data.departments;
      //departments = [];
    } else {
      fetchError = result.message || "Failed to load departments";
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An Unknown error occured";
    fetchError = message;
  }

  return (
    <section className={className}>
      <div className="container mx-auto px-4 py-12">
        {/* Section Title */}
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("ourDepartments")}
        </h2>

        {/* Departments Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {departments.map((department) => (
            <DepartmentCard
              key={department.id}
              title={department.name}
              icon={department.iconName}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
