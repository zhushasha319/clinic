"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/hooks/useTranslations";

interface DoctorProfileProps {
  name: string;
  brief: string;
}

export default function DoctorProfileAbout({
  name,
  brief,
}: DoctorProfileProps) {
  const t = useTranslations("doctors");
  return (
    <Card className="bg-background rounded-lg p-4 md:p-6 w-full border-0 shadow-small">
      <CardContent className="p-0">
        <h3 className="text-text-title mb-[14px]">
          {t("about")} {name}
        </h3>
        <p className="body-regular text-text-body-subtle">{brief}</p>
      </CardContent>
    </Card>
  );
}
