import { DynamicBanner } from "@/components/organisms/dynamic-banner";
import { DepartmentsSection } from "@/components/organisms/departments-section";
import { OurDoctors } from "@/components/organisms/our-doctors";
import { PatientTestimonials } from "@/components/organisms/patient-testimonials";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("common");
  const showOurDoctorsOnHome = false;

  return (
    <div>
      <DynamicBanner></DynamicBanner>
      <div className="flex flex-col p-8 max-w-7xl mx-auto w-full gap-16">
        <div>
          {" "}
          <p className="mt-4 mb-12 body-regular text-text-body-subtle max-w-3xl mx-auto text-center">
            {t("welcome")}
          </p>
          <DepartmentsSection id="our-departments"></DepartmentsSection>
        </div>

        {showOurDoctorsOnHome ? <OurDoctors></OurDoctors> : null}
        <PatientTestimonials></PatientTestimonials>
      </div>
    </div>
  );
}
