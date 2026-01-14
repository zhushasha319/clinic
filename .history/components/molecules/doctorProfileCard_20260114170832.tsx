import Image from "next/image";
import { DoctorDetails } from "@/types";

/**
 * RatingStars
 * - Displays 0..5 stars (supports decimals like 4.3)
 * - Uses an overlay technique to fill stars proportionally
 */
export function RatingStars({
  rating,
  outOf = 5,
  size = 18,
}: {
  rating: number;
  outOf?: number;
  size?: number;
}) {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(rating, outOf)) : 0;
  const percentage = (safeRating / outOf) * 100;

  // SVG star (Heroicons-like) — using currentColor for easy Tailwind coloring
  const Star = ({ className }: { className: string }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.4 8.72c-.783-.57-.38-1.81.588-1.81H6.45a1 1 0 00.95-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <div className="relative inline-flex items-center" aria-label={`Rating ${safeRating} out of ${outOf}`}>
      {/* base (empty stars) */}
      <div className="flex text-gray-300">
        {Array.from({ length: outOf }).map((_, i) => (
          <Star key={i} className="shrink-0" />
        ))}
      </div>

      {/* filled overlay */}
      <div
        className="absolute left-0 top-0 flex overflow-hidden text-yellow-500"
        style={{ width: `${percentage}%` }}
      >
        {Array.from({ length: outOf }).map((_, i) => (
          <Star key={i} className="shrink-0" />
        ))}
      </div>
    </div>
  );
}

/**
 * DoctorProfileTopCard
 * Based on screenshot layout (image on left, details on right)
 */
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
