import { DepartmentCard } from "@/components/molecules/departmentCard";

interface Department {
  id: string;
  title: string;
  icon: string;
}

interface DepartmentsSectionProps {
  departments?: Department[];
  className?: string;
}

const defaultDepartments: Department[] = [
  { id: "1", title: "Cardiology", icon: "Heart" },
  { id: "2", title: "Cardiology", icon: "Heart" },
  { id: "3", title: "Cardiology", icon: "Heart" },
  { id: "4", title: "Cardiology", icon: "Heart" },
  { id: "5", title: "Cardiology", icon: "Heart" },
  { id: "6", title: "Cardiology", icon: "Heart" },
];

export function DepartmentsSection({
  departments = defaultDepartments,
  className,
}: DepartmentsSectionProps) {
  return (
    <section className={className}>
      <div className="container mx-auto px-4 py-12">
        {/* Section Title */}
        <h2 className="text-2xl font-bold text-center mb-8">Our Departments</h2>

        {/* Departments Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {departments.map((department) => (
            <DepartmentCard
              key={department.id}
              title={department.title}
              icon={department.icon}
              onClick={() => console.log(`Clicked: ${department.title}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
