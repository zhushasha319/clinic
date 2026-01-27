"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import DateRangePicker from "@/components/admin/date-range-picker";
import { Button } from "@/components/ui/button";
import SignOutButton from "@/components/molecules/login/sign-out-button";

type AdminHeadProps = {
  initialStart: string;
  initialEnd: string;
  userName: string;
};

export function AdminHead({
  initialStart,
  initialEnd,
  userName,
}: AdminHeadProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-background px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <Button asChild variant="outline" className="w-full md:w-auto">
        <Link href="/" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          返回用户端
        </Link>
      </Button>

      <DateRangePicker initialStart={initialStart} initialEnd={initialEnd} />

      <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">管理员</p>
        </div>
        <SignOutButton variant="outline" className="h-9" />
      </div>
    </div>
  );
}
