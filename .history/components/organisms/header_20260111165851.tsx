import Link from "next/link";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full border-b bg-gray-50/50 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 sticky top-0 z-50">
      <div className="max-w-[1440px] h-[65px] container mx-auto flex h-16 items-center justify-between px-6 md">
        {/* Left: Logo and Brand Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">
            Highland Medical Center
          </span>
        </div>

        {/* Right: Navigation and Actions */}
        <div className="flex items-center gap-6">
          {/* Theme Toggle Icon */}
          <button className="text-gray-600 hover:text-gray-900 transition-colors">
            <Sun className="h-5 w-5" />
            <span className="sr-only">Toggle theme</span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              Home
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button asChild className="bg-blue-500 hover:bg-blue-600">
              <Link href="/appointment">Book Appointment</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              <Link href="/signin">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
