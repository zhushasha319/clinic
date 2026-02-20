import { PatientProfile } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Edit, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

interface PersonalInformationProps {
  patientData: PatientProfile;
  onEdit: () => void;
  onBackToAppointment?: () => void;
}

export default function PersonalInformation({
  patientData,
  onEdit,
  onBackToAppointment,
}: PersonalInformationProps) {
  const t = useTranslations();
  return (
    <Card className="w-full border border-border bg-background rounded-lg shadow-none mb-8 md:mb-10 p-0">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-7">
        <h3 className="text-text-title">{t("userProfile.personalInformation")}</h3>
        <div className="flex items-center gap-2">
          {onBackToAppointment && (
            <Button
              variant="ghost"
              onClick={onBackToAppointment}
              className="text-text-primary hover:text-text-primary/80 h-auto flex gap-2 items-center px-3"
            >
              <Pencil size={14} />
              <div className="body-small-bold text-text-primary">{t("userProfile.backToAppointment")}</div>
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onEdit}
            className="text-text-primary hover:text-text-primary/80 h-auto flex gap-4 items-center px-3"
          >
            <Edit size={14} />
            <div className="body-small-bold text-text-primary">{t("common.edit")}</div>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <div className="grid md:grid-cols-2 gap-y-6 gap-x-6">
          <div>
            <p className="body-small text-text-body-subtle">{t("userProfile.fullName")}</p>
            <p className="body-regular text-text-title">
              {patientData.name || "N/A"}
            </p>
          </div>
          <div>
            <p className="body-small text-text-body-subtle">{t("userProfile.email")}</p>
            <p className="body-regular text-text-title">
              {patientData.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="body-small text-text-body-subtle">{t("userProfile.phone")}</p>
            <p className="body-regular text-text-title">
              {patientData.phoneNumber || "N/A"}
            </p>
          </div>
          <div>
            <p className="body-small text-text-body-subtle">{t("userProfile.address")}</p>
            <p className="body-regular text-text-title">
              {patientData.address || "N/A"}
            </p>
          </div>
          <div>
            <p className="body-small text-text-body-subtle">{t("userProfile.dateOfBirth")}</p>
            <p className="body-regular text-text-title">
              {(() => {
                if (!patientData.dateOfBirth) return "N/A";
                try {
                  const date = new Date(patientData.dateOfBirth);
                  if (isNaN(date.getTime())) return "N/A";
                  return date.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                } catch {
                  return "N/A";
                }
              })()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
