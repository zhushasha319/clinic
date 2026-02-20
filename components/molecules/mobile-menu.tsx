"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import MobileUserSignOrAvatar from "./login/mobile-user-signinoravatar";
import { Menu } from "lucide-react";
import { Session } from "next-auth";
import { useTranslations } from "@/hooks/useTranslations";

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
  const t = useTranslations("common");

  return (
    <>
      {/*Mobile Nav*/}
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">{t("openMenu")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="text-left">{t("menu")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 mt-8">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("theme")}</span>
                <div className="flex gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>

              <Link
                href="/"
                className="text-lg font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {t("home")}
              </Link>

              <MobileUserSignOrAvatar session={session} />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
