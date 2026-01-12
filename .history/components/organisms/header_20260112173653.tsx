import Link from "next/link";
import { App_NAME } from "@/lib/constanse";
import MenuClient from "../molecules/menu-client";
import logo from 
export function Header() {
  return (
    <header className="w-full border-b bg-background-2 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1440px] h-[65px]  mx-auto flex  items-center justify-between px-6 md:px-8">
        {/* Left: Logo and Brand Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3">
            {" "}
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
            <span className="hidden  lg:block">
              {App_NAME}
            </span>
          </Link>
        </div>

        {/* Right: Navigation and Actions */}
        <div className="flex items-center gap-6">
        <MenuClient></MenuClient>
        </div>
      </div>
    </header>
  );
}
