"use client"

import { getDoctorDetails } from "@/lib/actions/doctor.actions";
import DoctorProfileAbout from "@/components/molecules/doctorFiles/doctorFileAbout";
import DoctorProfileTopCard from "@/components/molecules/doctorFiles/doctorProfileCard";
import { notFound } from "next/navigation";
import PatientReviews from "@/components/molecules/doctorFiles/Review/PatientReviews";
import { usePaginatedReviews } from "@/hooks/usePaginatedReviews";
interface Params {
  doctorId: string;
}

export default  async function DoctorProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
   
  const doctorIdObject = await params;
  const { doctorId } = doctorIdObject;

  let doctorDetailsResponse;
  try {
    doctorDetailsResponse = await getDoctorDetails(doctorId);
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    return (
      <div className="p-6 text-center text-red-500">
        <p>
          We&apos;re sorry , but something went wrong while trying to load the
          doctor&apos;s profile.
        </p>
        <p>Please try refreshing the page or check back later</p>
      </div>
    );
  }
  const doctor = doctorDetailsResponse.data;
  if (!doctor) {
    notFound();
  }
  const {
    reviews,
    totalReviews,
  // eslint-disable-next-line react-hooks/rules-of-hooks
  } = usePaginatedReviews(doctorId);
    const calculatedAverageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length
      : 0;
  return (
    <div className="w-full flex flex-col md:flex-row justify-between">
      <div className="flex flex-col gap-6 md:gap-8 md:max-w-[908px] p-8">
        <div>
          <DoctorProfileTopCard
            brief="Brief about the doctor"
            id={doctor.id}
            name={doctor.name}
            credentials={doctor?.credentials || ""}
            speciality={doctor?.speciality || ""}
            languages={doctor?.languages || []}
            specializations={doctor?.specializations || []}
            rating={calculatedAverageRating || 0}
            reviewCount={totalReviews || 0}
            image={doctor.image || ""}
          ></DoctorProfileTopCard>
        </div>
        <div className="md:hidden">Appoint Scheduler</div>
        <div>
          <DoctorProfileAbout
            name={doctor.name}
            brief={doctor?.brief || ""}
          ></DoctorProfileAbout>
        </div>
        <div>
          <PatientReviews
            doctorId={doctor.id}
          ></PatientReviews>
        </div>
      </div>
      <div className="hidden md:block">Appoint Scheduler</div>
    </div>
  );
}
