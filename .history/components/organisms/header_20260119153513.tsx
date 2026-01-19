import Link from "next/link";
import { App_NAME } from "@/lib/constants";
import MenuClient from "../molecules/mobile-memu";
import Image from "next/image";
import SigninOrAvatar from "../molecules/login/signin-avatar";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
export async function Header() {
  const session = await auth();
  return (
    <header className="w-full border-b bg-background-2 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1440px] h-[65px]  mx-auto flex  items-center justify-between px-6 md:px-8">
        {/* Left: Logo and Brand Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3">
            {" "}
            <div>
              <Image
                priority={true}
                src="/images/Logo.svg"
                width={32}
                height={32}
                alt={`${App_NAME}logo`}
              />
            </div>
            <span className="hidden  lg:block">{App_NAME}</span>
          </Link>
        </div>

        {/* Right: Navigation and Actions */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4"
            >
              Home
            </Link>
            <Button asChild variant="default" className="w-[164px]">
              <Link href="/#our-doctors">Book Appointment</Link>
            </Button>
            <SigninOrAvatar />
          </nav>
          <MenuClient session={session}></MenuClient>
        </div>
      </div>
    </header>
  );
}
