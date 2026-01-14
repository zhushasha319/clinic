import Image from "next/image";
import { DoctorDetails } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/RatingStars"; // adjust path to wherever you placed it

export default function DoctorProfileTopCard({
  name,
  credentials,
  speciality,
  languages,
  specializations,
  rating,
  reviewCount,
  image,
}: DoctorDetails) {
  const languagesText = languages?.length ? languages.join(", ") : "—";
  const specializationsText = specializations?.length ? specializations.join(", ") : "—";

  return (
    <Card className="w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Left: image */}
          <div className="relative h-[220px] w-full overflow-hidden rounded-2xl md:h-[240px] md:w-[260px]">
            <Image
              src={image || "/images/doctor-placeholder.jpg"}
              alt={name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 260px"
              className="object-cover"
            />
          </div>

          {/* Right: details */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {name}
              {credentials ? <span className="text-gray-900">, {credentials}</span> : null}
            </h2>

            <p className="mt-1 text-sm font-medium text-gray-600">{speciality}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RatingStars rating={rating} size={16} />
              <span className="text-sm font-medium text-gray-700">
                {Number.isFinite(rating) ? rating.toFixed(1) : "0.0"}
              </span>
              <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-500">Languages</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{languagesText}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-500">Specialisation</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{specializationsText}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
