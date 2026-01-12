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
        "w-full bg-white shadow-md border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-0 gap-3">
        {getIconComponent(icon, {
          className: "w-12 h-12 text-blue-500",
          fill: "currentColor",
        })}
        <h2 className="text-sm text-center font-bold text-gray-900">{title}</h2>
      </CardContent>
    </Card>
  );
}
