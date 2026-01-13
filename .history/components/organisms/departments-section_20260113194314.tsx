"use client";

import { DepartmentCard } from "@/components/molecules/departmentCard";
import { getDepartments } from "@/lib/actions/settings.actions";
import { DepartmentData } from "@/types";

interface DepartmentsSectionProps {
  className?: string;
}

export async function DepartmentsSection({ className }: DepartmentsSectionProps) {
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
        <h2 className="text-2xl font-bold text-center mb-8">Our Departments</h2>

        {/* Departments Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {departmentData.map((department) => (
            <DepartmentCard
              key={department.id}
              title={department.name}
              icon={department.iconName}
              onClick={() => console.log(`Clicked: ${department.name}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
