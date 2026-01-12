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
        className="w-full bg-background shadow-md border border-border-2 rounded-lg p-0"
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-0 gap-3">
        {getIconComponent(icon, { className: "w-12 h-12 text-blue-500",fill:'currentColor' })}
        <h2 className=" text-sm text-center font-bold">{title}</h2>
      </CardContent>
    </Card>
  );
}
