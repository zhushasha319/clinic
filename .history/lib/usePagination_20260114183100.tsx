import { useMemo } from "react";

export const DOTS = "...";

type PaginationItem = number | typeof DOTS;

type UsePaginationParams = {
  totalPages: number;
  currentPage: number;
  siblingCount?: number; // default 1
};

const range = (start: number, end: number): number[] => {
  const length = end - start + 1;
  if (length <= 0) return [];
  return Array.from({ length }, (_, i) => i + start);
};

export function usePagination({
  totalPages,
  currentPage,
  siblingCount = 1,
}: UsePaginationParams): PaginationItem[] {
  return useMemo(() => {
    const safeTotalPages = Number.isFinite(totalPages) ? Math.max(1, Math.floor(totalPages)) : 1;
    const safeCurrentPage = Number.isFinite(currentPage)
      ? Math.min(Math.max(1, Math.floor(currentPage)), safeTotalPages)
      : 1;

    // As requested
    const totalPageNumbers = 6;

    // If we can show all pages (no dots needed)
    if (totalPageNumbers >= safeTotalPages) {
      return range(1, safeTotalPages);
    }

    const leftSiblingIndex = Math.max(safeCurrentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(safeCurrentPage + siblingCount, safeTotalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < safeTotalPages - 2;

    const paginationRange: PaginationItem[] = [];

    // Always include first page
    paginationRange.push(1);

    // Left dots
    if (shouldShowLeftDots) {
      paginationRange.push(DOTS);
    }

    // Middle range
    const middleStart = shouldShowLeftDots ? leftSiblingIndex : 2;
    const middleEnd = shouldShowRightDots ? rightSiblingIndex : safeTotalPages - 1;

    paginationRange.push(...range(middleStart, middleEnd));

    // Right dots
    if (shouldShowRightDots) {
      paginationRange.push(DOTS);
    }

    // Always include last page
    paginationRange.push(safeTotalPages);

    return paginationRange;
  }, [totalPages, currentPage, siblingCount]);
}
