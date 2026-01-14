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
        {Ar
