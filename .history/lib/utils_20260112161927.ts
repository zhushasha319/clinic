import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LucideIcon, HelpCircle } from "lucide-react";
import * as LucidIcons from "lucide-react";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getIconComponent(
  iconName: string,
  props?: React.SVGProps<SVGSVGElement>
): React.ReactElement {
  // Try to get the icon from lucid-react using the string name
  // Note: iconName should be PascalCase (e.g., "Home", "User", "ChevronRight")
  const Icon =
    (LucidIcons as unknown as Record<string, LucideIcon>)[iconName] ||
    HelpCircle;
  return React.createElement(Icon, props);
}
