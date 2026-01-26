"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppointmentData, PatientData } from "@/types";
import BookingSteps from "@/components/molecules/appointment/BookingSteps";
import PatientDetailsForm from "@/components/molecules/appointment/PatientDetailsForm";
import { useTranslations } from "@/hooks/useTranslations";

interface PatientDetailsClientProps {
  initialAppointmentData: AppointmentData;
  initialPatientDetails: PatientData;
}

export default function PatientDetailsClient({
  initialAppointmentData,
  initialPatientDetails,
}: PatientDetailsClientProps) {
  const router = useRouter();
  const t = useTranslations("appointments");

  const { doctorName, doctorSpecilaity, doctorImage, date, timeSlot } =
    initialAppointmentData;

  // Debug log
  React.useEffect(() => {
    console.log("Doctor image URL:", doctorImage);
  }, [doctorImage]);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header: Selected Appointment */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <button
          type="button"
          onClick={() => router.replace("/doctors")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t("backToDoctors")}
        </button>

        <div className="text-sm text-gray-600">
          <span className="block text-xs text-gray-400">
            {t("bookingInProgress")}
          </span>
          <span className="font-medium text-gray-900">
            {date} - {timeSlot}
          </span>
        </div>
      </div>

      {/* Doctor Info */}
      <div className="flex items-center gap-4 border-b px-6 py-5">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
          {doctorImage ? (
            <Image
              src={doctorImage}
              alt={doctorName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-gray-400 text-xl font-semibold">
              {doctorName.charAt(0)}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900">{doctorName}</h2>
          <p className="text-sm text-gray-500">{doctorSpecilaity}</p>
        </div>
      </div>

      {/* Booking Steps */}
      <div className="px-6 py-6">
        <BookingSteps currentStep={2} />
      </div>

      <div className="h-px w-full bg-gray-200" />

      <div className="px-6 py-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          为谁预约？
        </h3>
        <PatientDetailsForm
          appointmentData={initialAppointmentData}
          patientDetails={initialPatientDetails}
        ></PatientDetailsForm>
      </div>
    </div>
  );
}
