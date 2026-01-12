import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getIconComponent } from "@/lib/utils";
import { useMemo } from "react";

interface DepartmentCard {
  title: string;
  icon: string;
  onClick?: () => void;
}
export function DepartmentCard({
  title,
  icon,
  onClick,
}: DepartmentCard) {
  const IconComponent = useMemo(() => getIconComponent(icon), [icon]);
  
  return (
    <Card
      className={cn(
        "w-44 h-[126px] flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow",
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-0 gap-3">
        <IconComponent />
        <span className="font-semibold text-sm text-center">{title}</span>
      </CardContent>
    </Card>
  );
}
