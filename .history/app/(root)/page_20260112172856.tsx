import { DynamicBanner } from "@/components/organisms/dynamic-banner"
import { DepartmentsSection } from "@/components/organisms/departments-section"
import { OurDoctors } from "@/components/organisms/our-doctors"
import { PatientTestimonials } from "@/components/organisms/patient-testimonials"
export default function Home() {
  return(
    <div>
     <DynamicBanner></DynamicBanner>
      <div className="flex flex-col p-8 max-w-7xl mx-auto w-full gap-16"></div>
     
      </div>
  )
}
