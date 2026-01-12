import Link from "next/link";
import { App_NAME } from "@/lib/constanse";
import MenuClient from "../molecules/menu-client";
import Image from "next/image";
export function Header() {
  return (
    <header className="w-full border-b bg-background-2 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1440px] h-[65px]  mx-auto flex  items-center justify-between px-6 md:px-8">
        {/* Left: Logo and Brand Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3">
            {" "}
            <div >
            <
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
