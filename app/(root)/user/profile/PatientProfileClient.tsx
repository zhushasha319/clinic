"use client";
import { PatientProfile, Appointment } from "@/types";
import { useEffect, useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import ProfileHeader from "@/components/organisms/user-profile/profile-header";
import PersonalInformation from "@/components/organisms/user-profile/personal-information";
import EditProfileModal from "@/components/molecules/userFiles/edit-patient-profile-modal";
import AppointmentsSection from "@/components/organisms/user-profile/appointments-sections";
import CancellationDialogs from "@/components/molecules/userFiles/cancel-dialogs";
import { cancelCashAppointment } from "@/lib/actions/shared.actions";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { ReviewFormValues } from "@/types";
import { submitPatientReview } from "@/lib/actions/review.action";
import ReviewDialog from "@/components/molecules/userFiles/review-dialog";

export default function PatientProfileClient({
  patientData,
  appointments,
  totalPages,
  currentPage,
  appointmentsError,
  appointmentId,
  returnTo,
}: {
  patientData: PatientProfile;
  appointments: Appointment[];
  appointmentId?: string;
  totalPages: number;
  currentPage: number;
  appointmentsError?: string | null;
  returnTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // 示例：https://examples.com/dashboard/users?page=1
  // pathname = /dashboard/users（示例）

  const searchParams = useSearchParams();
  const returnToParam = returnTo ?? searchParams.get("returnTo") ?? undefined;
  const appointmentIdParam =
    appointmentId ?? searchParams.get("appointmentId") ?? undefined;
  // 示例：https://examples.com/dashboard/users?page=1
  // searchParams = page=1（示例）

  const [isPending, startTransition] = useTransition();

  // 弹窗相关状态
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [isCancelInfoDialogOpen, setIsCancelInfoDialogOpen] = useState(false);
  const [isConfirmCancelCashDialogOpen, setIsConfirmCancelCashDialogOpen] =
    useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // 选中项状态
  const [appointToCacel, setAppointmentToCancel] = useState<Appointment | null>(
    null,
  );
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] =
    useState<Appointment | null>(null);

  useEffect(() => {
    if (appointmentsError) {
      toast.error("预约加载失败，请稍后再试。");
      console.log("Appointments Error:", appointmentsError);
    }
  }, [appointmentsError]);

  const handlePageChange = (page: number) => {
    const currentParams = new URLSearchParams(
      Array.from(searchParams.entries()),
    );
    // 示例：https://example.com/products?sort=price&category=electronics
    // 结果示例：["sort","price"]，["category","electronics"]
    currentParams.set("page", page.toString());
    const newUrl = `${pathname}?${currentParams.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  const handleConfirmCancelCash = () => {
    if (!appointToCacel) {
      return;
    }
    const idToCancel = appointToCacel.id;
    setIsConfirmCancelCashDialogOpen(false);
    startTransition(async () => {
      const result = await cancelCashAppointment(idToCancel);
      if (result.success) {
        toast.success(result.message || "预约已取消。");
        router.refresh();
      } else {
        toast.error(result.message || "取消预约失败。");
      }
      setAppointmentToCancel(null);
    });
  };

  const handleReviewSubmit = (formData: ReviewFormValues) => {
    if (!selectedAppointmentForReview) {
      toast.error("未选择要评价的预约。");
      return;
    }
    startTransition(async () => {
      const result = await submitPatientReview({
        appointmentId: selectedAppointmentForReview.id,
        doctorId: selectedAppointmentForReview.doctorId,
        rating: formData.rating,
        reviewText: formData.reviewText,
      });
      if (result.success) {
        toast.success(result.message || "评价提交成功。");
        setIsReviewDialogOpen(false);
        router.refresh();
      } else {
        const message = result.fieldErrors
          ? "请检查表单中的错误。"
          : result.message || "提交评价失败。";
        toast.error(message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background-1 max-w-[1440px] mx-auto p-6 md:p-8">
      <ProfileHeader patientData={patientData} />
      <PersonalInformation
        patientData={patientData}
        onEdit={() => setEditProfileModalOpen(true)}
        onBackToAppointment={
          returnToParam || appointmentIdParam
            ? () => {
                if (returnToParam) {
                  router.push(returnToParam);
                  return;
                }
                if (appointmentIdParam) {
                  router.push(
                    `/appointments/patient-details?appointmentId=${appointmentIdParam}`,
                  );
                }
              }
            : undefined
        }
      />
      <AppointmentsSection
        appointments={appointments}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onCancelInfo={() => setIsCancelInfoDialogOpen(true)}
        onConfirmCancelCash={(appointment) => {
          setAppointmentToCancel(appointment);
          setIsConfirmCancelCashDialogOpen(true);
        }}
        onReview={(appointment) => {
          setSelectedAppointmentForReview(appointment);
          setIsReviewDialogOpen(true);
        }}
        isPending={isPending}
      />

      {/* 弹窗 */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        patientData={patientData}
      />
      <CancellationDialogs
        isInfoOpen={isCancelInfoDialogOpen}
        onInfoOpenChange={setIsCancelInfoDialogOpen}
        isConfirmOpen={isConfirmCancelCashDialogOpen}
        onConfirmOpenChange={setIsConfirmCancelCashDialogOpen}
        onConfirmCancel={handleConfirmCancelCash}
        isPending={isPending}
      />
      {selectedAppointmentForReview && (
        <ReviewDialog
          isOpen={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          appointment={selectedAppointmentForReview}
          onSubmit={handleReviewSubmit}
          isSubmitting={isPending}
        />
      )}
    </div>
  );
}

