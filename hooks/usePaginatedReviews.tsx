import { useCallback, useEffect, useMemo, useState } from "react";
import { PAGE_SIZE } from "@/lib/constants";
import type { DoctorReview, ServerActionResponse } from "@/types";
import { getDoctorReviewsPaginated } from "@/lib/actions/review.action";

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

  // doctorId 变化时重置
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
        setError("缺少医生 ID。");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res: ServerActionResponse<DoctorReviewsPaginatedData> =
          await getDoctorReviewsPaginated(safeDoctorId, page, reviewsPerPage);

        if (!res.success || !res.data) {
          setError(res.error || res.message || "加载评价失败。");
          setReviews([]);
          setTotalReviews(0);
          setTotalPages(1);
          return;
        }

        setReviews(res.data.reviews);
        setTotalReviews(res.data.totalReviews);
        setTotalPages(res.data.totalPages);

        // 服务端可能会夹断 currentPage，保持客户端同步
        if (res.data.currentPage !== page) {
          setCurrentPage(res.data.currentPage);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "出现错误。");
      } finally {
        setLoading(false);
      }
    },
    [safeDoctorId, reviewsPerPage]
  );

  useEffect(() => {
    // 仅在有医生 ID 时才请求
    if (!safeDoctorId) return;
    fetchPage(currentPage);
  }, [safeDoctorId, currentPage, fetchPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      const next = Math.max(1, Math.floor(page));
      //（可选）若已知 totalPages，则夹断到范围内
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

