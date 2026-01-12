import { DynamicBanner } from "@/components/organisms/dynamic-banner"
import { DepartmentsSection } from "@/components/organisms/departments-section"
import { OurDoctors } from "@/components/organisms/our-doctors"
import { PatientTestimonials } from "@/components/organisms/patient-testimonials"
export default function Home() {
  return(
    <div>
     <DynamicBanner></DynamicBanner>
     <DepartmentsSection></DepartmentsSection>
     <OurDoctors></OurDoctors>
     <PatientTestimonials></PatientTestimonials>
      </div>
  )
}
