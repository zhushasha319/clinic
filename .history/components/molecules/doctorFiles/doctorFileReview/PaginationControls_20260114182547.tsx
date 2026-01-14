import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * How many sibling pages to show on each side of current page.
   * Screenshot looks like: 1 2 3 ... 53 (when current=1)
   */
  siblingCount?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Builds the page items array:
 * number => page
 * "ellipsis" => ...
 */
function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): Array<number | "ellipsis"> {
  if (totalPages <= 0) return [];

  // If small enough, show everything
  const maxVisible = 2 * siblingCount + 5; // first + last + current + siblings + 2 ellipsis (worst case)
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const firstPage = 1;
  const lastPage = totalPages;

  const leftSibling = Math.max(currentPage - siblingCount, firstPage);
  const rightSibling = Math.min(currentPage + siblingCount, lastPage);

  const showLeftEllipsis = leftSibling > firstPage + 1;
  const showRightEllipsis = rightSibling < lastPage - 1;

  const items: Array<number | "ellipsis"> = [];

  items.push(firstPage);

  if (showLeftEllipsis) items.push("ellipsis");

  // Middle range (avoid duplicating first/last)
  const start = Math.max(leftSibling, firstPage + 1);
  const end = Math.min(rightSibling, lastPage - 1);
  for (let p = start; p <= end; p++) items.push(p);

  if (showRightEllipsis) items.push("ellipsis");

  items.push(lastPage);

  return items;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationControlsProps) {
  const safeTotalPages = Number.isFinite(totalPages) ? Math.max(1, Math.floor(totalPages)) : 1;
  const safeCurrent = clamp(
    Number.isFinite(currentPage) ? Math.floor(currentPage) : 1,
    1,
    safeTotalPages
  );

  const items = React.useMemo(
    () => getPaginationItems(safeCurrent, safeTotalPages, siblingCount),
    [safeCurrent, safeTotalPages, siblingCount]
  );

  const goTo = (page: number) => onPageChange(clamp(page, 1, safeTotalPages));

  return (
    <Pagination className="w-full">
      <PaginationContent className="justify-start gap-2">
        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (safeCurrent > 1) goTo(safeCurrent - 1);
            }}
            className={`gap-2 ${
              safeCurrent === 1 ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>

        {/* Page numbers + ellipsis */}
        {items.map((it, idx) => {
          if (it === "ellipsis") {
            return (
              <PaginationItem key={`el-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          const page = it;
          const isActive = page === safeCurrent;

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={isActive}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(page);
                }}
                className="h-10 w-10 rounded-md"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (safeCurrent < safeTotalPages) goTo(safeCurrent + 1);
            }}
            className={`gap-2 ${
              safeCurrent === safeTotalPages ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
