import { DynamicBanner } from "@/components/organisms/dynamic-banner";
import { DepartmentsSection } from "@/components/organisms/departments-section";
import { OurDoctors } from "@/components/organisms/our-doctors";
import { PatientTestimonials } from "@/components/organisms/patient-testimonials";
export default function Home() {
  return (
    <div>
      <DynamicBanner></DynamicBanner>
      <div className="flex flex-col p-8 max-w-7xl mx-auto w-full gap-16">
        <div>
          {" "}
          <p className="mt-4 mb-12 body-regular text-text-body-subtle max-w-3xl mx-auto text-center">
            Welcome to Highland Medical Center, your premier destination for
            specialized healthcare consultation. Our facility brings together
            exceptional physicians across all major medical departments,
            offering expert diagnosis and personalized treatment planning in one
            convenient location.
          </p>
          <DepartmentsSection></DepartmentsSection>
        </div>

        <OurDoctors></OurDoctors>
        <PatientTestimonials></PatientTestimonials>
      </div>
    </div>
  );
}
