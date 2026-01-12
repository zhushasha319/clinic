import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getIconComponent } from "@/lib/utils";

interface DepartmentCard {
  title: string;
  icon: string;
  className?: string;
  onClick?: () => void;
}
const iconComponent = getIconComponent('icon')
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
       <iconComponent></iconComponent>
        <span className="font-semibold text-sm text-center">{title}</span>
      </CardContent>
    </Card>
  );
}
