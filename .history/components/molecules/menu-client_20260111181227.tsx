import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { InteractiveSignInButton } from "./interactive-sign-in-button";

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
          <Link href="/appointment">Book Appointment</Link>
        </Button>

        <InteractiveSignInButton className="w-[97px]" />
      </nav>

      {/*Mobile Nav*/}
      <nav className="md:hidden"></nav>
    </>
  );
}
