import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewProfileButton } from "./view-profile-button";

interface DoctorCardProps {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  image: string;
  className?: string;
}

export function DoctorCard({
  id,
  name,
  specialty,
  rating,
  reviewCount,
  image,
  className,
}: DoctorCardProps) {
  return (
    <Card className={cn("w-[384px] p-6", className)}>
      <CardContent className="p-0">
        <div className="flex items-start gap-4 mb-6">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>

          <div className="flex flex-col space-y-1 pt-0.5">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-none">
              {name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {specialty}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {rating}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({reviewCount} reviews)
              </span>
            </div>
          </div>
        </div>

        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium h-10"
          asChild
        >
          <Link href={`/doctors/${id}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
