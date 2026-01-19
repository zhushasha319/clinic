
import { redirect } from "next/navigation";

import {
  getUserDetails,
  getUserAppointments,
} from "@/lib/actions/user.actions";

import PatientProfileClient from "./patient-profile-client";
import type { PatientProfile, Appointment } from "@/types";
import { PAGE_SIZE } from "@/lib/constants";

// Helper Function (outside component)
function redirectToErrorPage(errorType?: string, errorMessage?: string) {
  const params = new URLSearchParams();

  if (errorType) params.set("errorType", errorType);
  if (errorMessage) params.set("errorMessage", errorMessage);

  const query = params.toString();
  redirect(query ? `/?${query}` : "/");
}

export default async function PatientProfilePage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  // 1) Get page number from URL
  const currentPage = Math.max(1, Number(searchParams?.page ?? "1") || 1);

  // 2) Get patient data
  const userRes = await getUserDetails();//自己定义错误处理逻辑

  if (!userRes.success || !userRes.data) {
    const errorType = userRes.errorType?.toLowerCase();
    const errorMsg = userRes.error ?? userRes.message ?? "Failed to fetch user details.";

    // Authentication -> /sign-in
    if (errorType === "authentication" || errorType === "unauthorized") {
      redirect("/sign-in");
    }

    // Not found -> not-found page
    if (errorType === "notfound" || errorType === "not_found" || errorType === "not-found") {
      redirect("/not-found");
    }

    // Others -> redirect with error details using helper
    redirectToErrorPage(userRes.errorType, errorMsg);
  }

  const patientData: PatientProfile = userRes.data;

  // 3) Get appointments (paginate by PAGE_SIZE)
  const apptRes = await getUserAppointments({
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const appointments: Appointment[] = apptRes.success && apptRes.data
    ? apptRes.data.appointments
    : [];

  const totalPages = apptRes.success && apptRes.data ? apptRes.data.totalPages : 1;

  // Per requirement: if appointments error, just pass it to client
  const appointmentsError =
    apptRes.success ? undefined : (apptRes.error ?? apptRes.message ?? "Failed to fetch appointments.");

  // Optional: your client prop requires this, but we don't have an appointmentId here.
  // Keeping it as undefined unless your client expects something else.
  const appointmentId = undefined as unknown as string | undefined;

  return (
    <div className="w-full">
      <PatientProfileClient
        patientData={patientData}
        appointments={appointments}
        appointmentId={appointmentId}
        totalPages={totalPages || 1}
        currentPage={currentPage || 1}
        appointmentsError={appointmentsError}
      />
    </div>
  );
}
