"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaginatedReviews } from "@/hooks/usePaginatedReviews";
import { PAGE_SIZE } from "@/lib/constants";
import ReviewList from "./ReviewList";
import PaginationControls from "./PaginationControls";
import  RatingStars  from "../../RatingStars";

interface PatientReviewsProps {
  doctorId: string;
  averageRating: number;
}

export default function PatientReviews({ doctorId, averageRating }: PatientReviewsProps) {
  const {
    currentPage,
    reviews,
    totalReviews,
    totalPages,
    loading,
    error,
    handlePageChange,
  } = usePaginatedReviews(doctorId);
//averageRating应该是算出来的
  const calculatedAverageRating =
  return (
    <Card className="w-full rounded-2xl border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          Patient Reviews
        </CardTitle>

        {/* Top-right rating summary */}
        <div className="flex items-start gap-2">
          <span className="text-2xl font-semibold text-gray-900">
            {Number.isFinite(averageRating) ? averageRating.toFixed(1) : "0.0"}
          </span>
          <div className="flex flex-col items-end">
            <RatingStars rating={Number.isFinite(averageRating) ? averageRating : 0} size={16} />
            <span className="mt-1 text-xs text-gray-500">{totalReviews} reviews</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* List */}
        <ReviewList
          reviews={reviews}
          currentPage={currentPage}
          totalReviews={totalReviews}
          pageSize={PAGE_SIZE}
          loading={loading}
          error={error}
        />

        {/* Bottom pagination row */}
        <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
