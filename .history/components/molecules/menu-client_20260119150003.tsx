import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import MobileUserSignOrAvatar from "../molecules/mobile-user-signinoravatar";
import { Menu } from "lucide-react";
import { Session } from "next-auth";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MenuClientProps {
  session: Session | null;
}

export default function MenuClient({ session }: MenuClientProps) {
  return (
    <>
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

              <Button asChild variant="default" className="w-full">
                <Link href="/#our-doctors">Book Appointment</Link>
              </Button>

              <MobileUserSignOrAvatar session={session} />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
