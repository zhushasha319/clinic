import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getIconComponent } from "@/lib/utils";

interface DepartmentCard {
  title: string;
  icon: string;
  onClick?: () => void;
}

export function DepartmentCard({ title, icon, onClick }: DepartmentCard) {
  return (
    <Card
      className={cn(
        "w-44 h-[126px] flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-0 gap-3">
        {getIconComponent(icon, { className: "w-12 h-12 text-blue-500" })}
        <h2 className="font-semibold text-sm text-center font-bold">{title}</h2>
      </CardContent>
    </Card>
  );
}
