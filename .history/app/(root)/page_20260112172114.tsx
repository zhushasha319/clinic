import { DynamicBanner } from "@/components/organisms/dynamic-banner"
import { DepartmentsSection } from "@/components/organisms/departments-section"
import { OurDoctors } from "@/components/organisms/our-doctors"
import {  } from "module";
export default function Home() {
  return(
    <div>
     <DynamicBanner></DynamicBanner>
     <DepartmentsSection></DepartmentsSection>
     <OurDoctors></OurDoctors>
      </div>
  )
}
