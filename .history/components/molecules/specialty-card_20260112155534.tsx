import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import get

interface DepartmentCard {
  title: string;
  icon: LucideIcon;
  className?: string;
  onClick?: () => void;
}

export function DepartmentCard({
  title,
  icon: Icon,
  className,
  onClick,
}: DepartmentCard) {
  return (
    <Card
      className={cn(
        "w-[176px] h-[126px] flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-0 gap-3">
        <Icon className="h-8 w-8 text-blue-500" />
        <span className="font-semibold text-sm text-center">{title}</span>
      </CardContent>
    </Card>
  );
}
