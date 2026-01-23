"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

import type { PatientProfile } from "@/types";
import { patientProfileUpdateSchema } from "@/lib/validations/auth";
import { ProfileUpdateInput } from "@/types";

import { updateUserProfile } from "@/lib/actions/user.actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: PatientProfile;
}

// Convert various date strings to yyyy-mm-dd for <input type="date" />
function toDateInputValue(dateString?: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  patientData,
}: EditProfileModalProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(patientProfileUpdateSchema),
    defaultValues: {
      name: patientData?.name ?? "",
      phoneNumber: patientData?.phoneNumber ?? "",
      address: patientData?.address ?? "",
      dateOfBirth: toDateInputValue(patientData?.dateOfBirth) || undefined,
    },
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  // When modal opens / patientData changes, re-fill values
  React.useEffect(() => {
    if (!isOpen) return;

    reset({
      name: patientData?.name ?? "",
      phoneNumber: patientData?.phoneNumber ?? "",
      address: patientData?.address ?? "",
      dateOfBirth: toDateInputValue(patientData?.dateOfBirth) || undefined,
    });
    setServerError(null);
  }, [isOpen, patientData, reset]);

  const onSubmit = async (values: ProfileUpdateInput) => {
    setServerError(null);

    // Normalize: empty optional fields -> undefined (schema expects optional)
    const payload: ProfileUpdateInput = {
      name: values.name,
      phoneNumber: values.phoneNumber,
      address: values.address?.trim() ? values.address.trim() : undefined,
      dateOfBirth: values.dateOfBirth?.trim() ? values.dateOfBirth : undefined,
    };

    const res = await updateUserProfile(payload);

    if (!res.success) {
      // If server returns fieldErrors, you can optionally map them into RHF:
      // (keeping it simple: show top error message)
      setServerError(res.error || res.message || "Failed to update profile.");
      return;
    }

    // Success: update session with new name, show toast, close modal, and refresh to get updated data
    await updateSession({
      user: {
        name: payload.name,
      },
    });

    toast.success("Profile updated successfully!");
    onClose();
    router.refresh(); //刷新页面数据
  };

  const handleCancel = () => {
    // reset to original data when cancelling
    reset({
      name: patientData?.name ?? "",
      phoneNumber: patientData?.phoneNumber ?? "",
      address: patientData?.address ?? "",
      dateOfBirth: toDateInputValue(patientData?.dateOfBirth) || undefined,
    });
    setServerError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your full name"
              {...register("name")}
            />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="1234567"
              {...register("phoneNumber")}
              inputMode="tel"
            />
            {errors.phoneNumber?.message && (
              <p className="text-sm text-destructive">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Your address"
              className="min-h-[84px]"
              {...register("address")}
            />
            {errors.address?.message && (
              <p className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            {errors.dateOfBirth?.message && (
              <p className="text-sm text-destructive">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-[110px]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-[140px]">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
