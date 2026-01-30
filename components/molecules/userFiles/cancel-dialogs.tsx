"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";

interface CancellationDialogsProps {
  isInfoOpen: boolean;
  onInfoOpenChange: (isOpen: boolean) => void;
  isConfirmOpen: boolean;
  onConfirmOpenChange: (isOpen: boolean) => void;
  onConfirmCancel: () => void;
  isPending: boolean;
}

export default function CancellationDialogs({
  isInfoOpen,
  onInfoOpenChange,
  isConfirmOpen,
  onConfirmOpenChange,
  onConfirmCancel,
  isPending,
}: CancellationDialogsProps) {
  const t = useTranslations('common');
  return (
    <>
      {/* Dialog 1: 非现金支付 */}
      <Dialog open={isInfoOpen} onOpenChange={onInfoOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t("appointment.cancelTitle")}
            </DialogTitle>
            <DialogDescription className="pt-4 text-base text-gray-600 dark:text-gray-300">
              {t("appointment.cancelInfo")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("ok")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: 现金支付 */}
      <Dialog open={isConfirmOpen} onOpenChange={onConfirmOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t("appointment.cancelTitle")}
            </DialogTitle>
            <DialogDescription className="pt-4 text-base text-gray-600 dark:text-gray-300">
              {t("appointment.cancelConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 sm:justify-end space-x-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="default"
                disabled={isPending}
                className="text-text-caption-2"
              >
                {t("no")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="outline"
              onClick={onConfirmCancel}
              disabled={isPending}
              className="border border-border"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("appointment.cancelling")}
                </>
              ) : (
                t("yes")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
