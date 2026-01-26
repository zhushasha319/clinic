"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
interface ViewProfileButtonProps {
  doctorId: string;
}

export function ViewProfileButton({ doctorId }: ViewProfileButtonProps) {
  const router = useRouter();
  const t = useTranslations("doctors");
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    router.push(`/doctors/${doctorId}`);
  };

  return (
    <Button
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium h-10"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("loading")}
        </>
      ) : (
        t("viewProfile")
      )}
    </Button>
  );
}
