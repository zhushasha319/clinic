import Link from 'next/link';
import { Sun } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full border-b bg-gray-50/50 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
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
            <Link
              href="/appointment"
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50"
            >
              Book Appointment
            </Link>
            <Link
              href="/signin"
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
