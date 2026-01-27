import { useMemo } from "react";

export const DOTS = "...";

type PaginationItem = number | typeof DOTS;

type UsePaginationParams = {
  totalPages: number;
  currentPage: number;
  siblingCount?: number; // 默认 1
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

    // 按需求固定数量
    const totalPageNumbers = 6;

    // 若页数不多则直接展示全部（无需省略号）
    if (totalPageNumbers >= safeTotalPages) {
      return range(1, safeTotalPages);
    }

    const leftSiblingIndex = Math.max(safeCurrentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(safeCurrentPage + siblingCount, safeTotalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < safeTotalPages - 2;

    const paginationRange: PaginationItem[] = [];

    // 始终包含第一页
    paginationRange.push(1);

    // 左侧省略号
    if (shouldShowLeftDots) {
      paginationRange.push(DOTS);
    }

    // 中间区间
    const middleStart = shouldShowLeftDots ? leftSiblingIndex : 2;
    const middleEnd = shouldShowRightDots ? rightSiblingIndex : safeTotalPages - 1;

    paginationRange.push(...range(middleStart, middleEnd));

    // 右侧省略号
    if (shouldShowRightDots) {
      paginationRange.push(DOTS);
    }

    // 始终包含最后一页
    paginationRange.push(safeTotalPages);

    return paginationRange;
  }, [totalPages, currentPage, siblingCount]);
}

