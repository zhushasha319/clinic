import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LucideIcon, HelpCircle } from "lucide-react";
import * as LucidIcons from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIconComponent(iconName: string): LucideIcon {
  // Try to get the icon from lucid-react using the string name
  // Note: iconName should be PascalCase (e.g., "Home", "User", "ChevronRight")
  const icon = (LucidIcons as unknown as Record<string, LucideIcon>)[iconName];

  // Return the found icon, or a default fallback icon (like HelpCircle)
  return icon || HelpCircle;
}
