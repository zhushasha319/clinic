import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LucideIcon, HelpCircle } from "lucide-react";
import * as LucidIcons from "lucide-react";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(value: number, maxFractionDigits = 2) {
  if (!Number.isFinite(value)) return "0";
  const fixed = value.toFixed(maxFractionDigits);
  return maxFractionDigits > 0 ? fixed.replace(/\.?0+$/, "") : fixed;
}

export function getIconComponent(
  iconName: string,
  props?: React.SVGProps<SVGSVGElement>
) {
  // 根据字符串名称从 lucide-react 获取图标
  // 注意：iconName 需为 PascalCase（如 "Home"、"User"、"ChevronRight"）
  const Icon =
    (LucidIcons as unknown as Record<string, LucideIcon>)[iconName] ||
    HelpCircle;
  return <Icon {...props} />;
}

