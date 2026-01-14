import React from "react";
import type { DoctorReview } from "@/types";
import  RatingStars  from "";

type ReviewListProps = {
  reviews: DoctorReview[];
  totalReviews: number;
  currentPage: number;
  pageSize: number;
  loading?: boolean;
  error?: string | null;
};

function formatMonthYear(reviewDate: string) {
  // reviewDate from server action is already a formatted string,
  // but we can still try to parse it for "Month YYYY" display.
  // If parsing fails, we fall back to showing the original string.
  const d = new Date(reviewDate);
  if (Number.isNaN(d.getTime())) return reviewDate;

  return d.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function ReviewList({
  reviews,
  totalReviews,
  currentPage,
  pageSize,
  loading = false,
  error = null,
}: ReviewListProps) {
  const safeTotal = Number.isFinite(totalReviews) ? Math.max(0, totalReviews) : 0;
  const safePage = Number.isFinite(currentPage) ? Math.max(1, currentPage) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.max(1, pageSize) : 10;

  const startIndex = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const endIndex = safeTotal === 0 ? 0 : Math.min(safePage * safePageSize, safeTotal);

  return (
    <div className="w-full">
      {/* Top line */}
      <div className="mb-4 text-sm text-gray-600">
        {loading ? (
          <span>Loading reviews…</span>
        ) : (
          <span>
            Showing {startIndex}-{endIndex} of {safeTotal} reviews
          </span>
        )}
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Empty */}
      {!loading && !error && reviews.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-600">
          No reviews yet.
        </div>
      ) : null}

      {/* Reviews */}
      <div className="divide-y divide-gray-200">
        {reviews.map((r) => {
          const monthYear = formatMonthYear(r.reviewDate);
          const displayName = r.patientName?.trim() ? r.patientName.trim() : "Anonymous";

          return (
            <div key={r.id} className="py-8">
              <div className="flex items-center gap-4">
                <RatingStars rating={r.rating ?? 0} size={20} />
                <span className="text-lg font-medium text-gray-700">{monthYear}</span>
              </div>

              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                “{r.testimonialText}”
              </p>

              <p className="mt-4 text-lg text-gray-700">- {displayName}.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
