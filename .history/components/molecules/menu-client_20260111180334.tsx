import Link from "next/link";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MenuClient() {
  return (
    <>
      {/*Desktop Nav*/}
      <nav className="hidden md:flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-gray-900"
        >
          <Sun className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Link
          href="/"
          className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4"
        >
          Home
        </Link>

        <Button asChild variant="brand" className="w-[164px]">
          <Link href="/appointment">Book Appointment</Link>
        </Button>

        <Button asChild variant="secondary" className="w-[97px]">
          <Link href="/signin">Sign in</Link>
        </Button>
      </nav>

      {/*Mobile Nav*/}
      <nav className="md:hidden"></nav>
    </>
  );
}
