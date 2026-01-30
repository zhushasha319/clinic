"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

interface BookingStepsProps {
  currentStep?: 1 | 2 | 3 | 4;
}

const STEP_KEYS = [
  "booking.selectSlot",
  "booking.patientDetails",
  "booking.payment",
  "booking.confirmation",
];

export default function BookingSteps({ currentStep = 3 }: BookingStepsProps) {
  const t = useTranslations('common');
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEP_KEYS.map((key, index) => {
          const stepNumber = (index + 1) as 1 | 2 | 3 | 4;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={key} className="flex flex-1 items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold",
                    {
                      "border-blue-600 bg-blue-600 text-white": isCompleted,
                      "border-blue-600 text-blue-600": isCurrent,
                      "border-gray-300 text-gray-400":
                        !isCompleted && !isCurrent,
                    },
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                </div>

                {/* Label */}
                <span
                  className={cn("mt-2 text-xs font-medium", {
                    "text-blue-600": isCompleted || isCurrent,
                    "text-gray-400": !isCompleted && !isCurrent,
                  })}
                >
                  {t(key)}
                </span>
              </div>

              {/* Connector line (except last step) */}
              {index !== STEP_KEYS.length - 1 && (
                <div
                  className={cn("mx-2 h-[2px] flex-1", {
                    "bg-blue-600": stepNumber < currentStep,
                    "bg-gray-300": stepNumber >= currentStep,
                  })}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
