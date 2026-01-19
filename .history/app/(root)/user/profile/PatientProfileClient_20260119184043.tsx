"use client";
import { PatientProfile, Appointment } from "@/types";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
// import ProfileHeader from "@/components/organisms/user-profile/profile-header";
// import PersonalInformation from "@/components/organisms/user-profile/personal-information";
// import EditProfileModal from "@/components/molecules/user-profile/edit-patient-profile-modal";
 
export default function PatientProfileClient({
  patientData,
  appointmentsError,
}: {
  patientData: PatientProfile;
  appointments: Appointment[];
  appointmentId?: string;
  totalPages: number;
  currentPage: number;
  appointmentsError?: string | null;
}) {
  useEffect(() => {
    if (appointmentsError) {
      toast.error("Appointments could not be loaded. Please again later");
      console.log("Appointments Error:", appointmentsError);
    }
  }, [appointmentsError]);
  
  return (
    <div>
      User Profile 
    </div>
  );
}