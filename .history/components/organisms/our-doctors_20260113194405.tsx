import { DoctorCard } from "@/components/molecules/doctor-card";
import { getOurDoctors } from "@/lib/actions/doctor.actions";

interface OurDoctorsProps {
  className?: string;
}

export function OurDoctors({ className }: OurDoctorsProps) {
  return (
    <section className={className}>
      <div className="container mx-auto px-4 py-12">
        {/* Section Title */}
        <h2 className="text-2xl font-bold text-center mb-8">Our Doctors</h2>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {doctorData.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              id={doctor.id}
              name={doctor.name}
              specialty={doctor.specialty}
              rating={doctor.rating}
              reviewCount={doctor.reviewCount}
              image={doctor.imageUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
