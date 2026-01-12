import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TestimonialCardProps {
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  className?: string;
}

export function TestimonialCard({
  name,
  avatar,
  rating,
  comment,
  date,
  className,
}: TestimonialCardProps) {
  return (
    <Card className={cn("w-[384px] p-6", className)}>
      <CardContent className="p-0 space-y-4">
        {/* Header with avatar, name, and rating */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
            <Image
              src={avatar}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="flex flex-col">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
              {name}
            </h3>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "w-4 h-4",
                    index < rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Comment text */}
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {comment}
        </p>

        {/* Date */}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {date}
        </p>
      </CardContent>
    </Card>
  );
}
