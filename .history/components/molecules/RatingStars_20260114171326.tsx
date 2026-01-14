import React from "react";
import { Star } from "lucide-react";

type RatingStarsProps = {
  rating: number;
  /**
   * Star size in px (lucide uses width/height).
   * Default: 16
   */
  size?: number;
  /**
   * Fill color for filled/half-filled portion.
   * Default: "rgb(234 179 8)" (Tailwind yellow-500)
   *
   * Tip: you can pass "currentColor" and set text color on a parent.
   */
  color?: string;
  /**
   * Total number of stars. Default 5.
   */
  outOf?: number;
  /**
   * Optional className for layout tweaks.
   */
  className?: string;
};

export defunction RatingStars({
  rating,
  size = 16,
  color = "rgb(234 179 8)", // yellow-500
  outOf = 5,
  className = "",
}: RatingStarsProps) {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(rating, outOf)) : 0;

  const fullStars = Math.floor(safeRating);
  const decimal = safeRating - fullStars;
  // Only show a half star when decimal >= 0.5 (e.g., 4.5 -> half on last star)
  const hasHalfStar = decimal >= 0.5;

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label={`Rating ${safeRating} out of ${outOf}`}
      role="img"
    >
      {Array.from({ length: outOf }).map((_, i) => {
        const isFull = i < fullStars;
        const isHalf = i === fullStars && hasHalfStar;

        // Common lucide Star style
        const baseProps = {
          size,
          className: "shrink-0",
        };

        if (isFull) {
          return (
            <Star
              key={i}
              {...baseProps}
              fill={color}
              stroke={color}
            />
          );
        }

        if (isHalf) {
          // Half filled: render an "empty" star, then overlay a clipped filled star at 50%
          return (
            <span
              key={i}
              className="relative inline-block"
              style={{ width: size, height: size }}
            >
              {/* empty star */}
              <Star
                {...baseProps}
                className="absolute left-0 top-0 shrink-0 text-gray-300"
                fill="transparent"
                stroke="currentColor"
              />
              {/* left-half filled star */}
              <span
                className="absolute left-0 top-0 overflow-hidden"
                style={{ width: "50%", height: "100%" }}
              >
                <Star
                  {...baseProps}
                  className="shrink-0"
                  fill={color}
                  stroke={color}
                />
              </span>
            </span>
          );
        }

        // empty
        return (
          <Star
            key={i}
            {...baseProps}
            className="shrink-0 text-gray-300"
            fill="transparent"
            stroke="currentColor"
          />
        );
      })}
    </div>
  );
}
