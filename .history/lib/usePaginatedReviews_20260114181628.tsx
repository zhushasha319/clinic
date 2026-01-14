import { useCallback, useEffect, useMemo, useState } from "react";
import { PAGE_SIZE } from "@/lib/constants";
import type { DoctorReview, ServerActionResponse } from "@/types";
import { getDoctorReviewsPaginated } from 

interface DoctorReviewsPaginatedData {
  reviews: DoctorReview[];
  totalReviews: number;
  totalPages: number;
  currentPage: number;
}

type UsePaginatedReviewsReturn = {
  currentPage: number;
  reviews: DoctorReview[];
  totalReviews: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  handlePageChange: (page: number) => void;
};

export const usePaginatedReviews = (
  doctorId: string,
  initialPage = 1,
  reviewsPerPage = PAGE_SIZE
): UsePaginatedReviewsReturn => {
  const [currentPage, setCurrentPage] = useState<number>(Math.max(1, initialPage));
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when doctorId changes
  useEffect(() => {
    setCurrentPage(Math.max(1, initialPage));
    setReviews([]);
    setTotalReviews(0);
    setTotalPages(1);
    setError(null);
  }, [doctorId, initialPage]);

  const safeDoctorId = useMemo(() => doctorId?.trim() ?? "", [doctorId]);

  const fetchPage = useCallback(
    async (page: number) => {
      if (!safeDoctorId) {
        setReviews([]);
        setTotalReviews(0);
        setTotalPages(1);
        setError("Doctor id is missing.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res: ServerActionResponse<DoctorReviewsPaginatedData> =
          await getDoctorReviewsPaginated(safeDoctorId, page, reviewsPerPage);

        if (!res.success || !res.data) {
          setError(res.error || res.message || "Failed to load reviews.");
          setReviews([]);
          setTotalReviews(0);
          setTotalPages(1);
          return;
        }

        setReviews(res.data.reviews);
        setTotalReviews(res.data.totalReviews);
        setTotalPages(res.data.totalPages);

        // Server might clamp currentPage; keep client in sync.
        if (res.data.currentPage !== page) {
          setCurrentPage(res.data.currentPage);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [safeDoctorId, reviewsPerPage]
  );

  useEffect(() => {
    // Only fetch when we have a doctor id
    if (!safeDoctorId) return;
    fetchPage(currentPage);
  }, [safeDoctorId, currentPage, fetchPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      const next = Math.max(1, Math.floor(page));
      // (Optional) clamp to totalPages if we already know it
      const clamped = totalPages ? Math.min(next, totalPages) : next;
      setCurrentPage(clamped);
    },
    [totalPages]
  );

  return {
    currentPage,
    reviews,
    totalReviews,
    totalPages,
    loading,
    error,
    handlePageChange,
  };
};
