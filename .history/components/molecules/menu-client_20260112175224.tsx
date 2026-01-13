import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InteractiveSignInButton } from "./interactive-sign-in-button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function MenuClient() {
  return (
    <>
      {/*Desktop Nav*/}
      <nav className="hidden md:flex items-center gap-3">
        <ThemeToggle />

        <Link
          href="/"
          className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4"
        >
          Home
        </Link>

        <Button asChild variant="brand" className="w-[164px]">
          <Link href="/#our-">Book Appointment</Link>
        </Button>

        <InteractiveSignInButton className="w-[97px]" />
      </nav>

      {/*Mobile Nav*/}
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 mt-8">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>

              <Link
                href="/"
                className="text-lg font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>

              <Button asChild variant="brand" className="w-full">
                <Link href="/appointment">Book Appointment</Link>
              </Button>

              <InteractiveSignInButton className="w-full" />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
