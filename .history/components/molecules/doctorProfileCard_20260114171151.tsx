import Image from "next/image";
import { DoctorDetails } from "@/types";
imp

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
  const languagesText =
    languages?.length ? languages.join(", ") : "—";

  const specializationsText =
    specializations?.length ? specializations.join(", ") : "—";

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row">
        {/* Left: image */}
        <div className="relative h-[220px] w-full overflow-hidden rounded-2xl md:h-[240px] md:w-[260px]">
          <Image
            src={image || "/images/doctor-placeholder.jpg"} // ensure you have this fallback
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 260px"
            priority
          />
        </div>

        {/* Right: main content */}
        <div className="flex-1">
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900">
            {name}
            {credentials ? (
              <span className="text-gray-900">, {credentials}</span>
            ) : null}
          </h2>

          {/* Speciality */}
          <p className="mt-1 text-sm font-medium text-gray-600">{speciality}</p>

          {/* Rating row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RatingStars rating={rating} />
            <span className="text-sm font-medium text-gray-700">
              {Number.isFinite(rating) ? rating.toFixed(1) : "0.0"}
            </span>
            <span className="text-sm text-gray-500">
              ({reviewCount} reviews)
            </span>
          </div>

          {/* Info cards */}
          <div className="mt-4 space-y-3">
            {/* Languages */}
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Languages</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {languagesText}
              </p>
            </div>

            {/* Specialisation */}
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Specialisation</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {specializationsText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
