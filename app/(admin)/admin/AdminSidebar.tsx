"use client";

import {
  CalendarCheck2,
  LayoutDashboard,
  Settings,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/admin/dashboard" && pathname === "/admin");

  const linkClass = (href: string, inactive?: string) =>
    [
      "flex items-center gap-3 rounded-md px-3 py-2 font-medium transition",
      isActive(href) ? "bg-emerald-500/30 text-white" : inactive ?? "text-white/75 hover:bg-white/10",
    ].join(" ");

  return (
    <aside className="w-full shrink-0 bg-(--color-text-primary) text-white md:w-64">
      <div className="flex items-center gap-3 border-b border-white/15 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold">MedAdmin</p>
          <p className="text-xs text-white/70">诊所管理台</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4 text-sm">
        <Link
          href="/admin/dashboard"
          className={linkClass("/admin/dashboard")}
        >
          <LayoutDashboard className="h-4 w-4" />
          仪表盘
        </Link>
        <Link
          href="/admin/doctors"
          className={linkClass("/admin/doctors")}
        >
          <Stethoscope className="h-4 w-4" />
          医生管理
        </Link>
       
          <Link
            href="/admin/appointment-action"
            className={linkClass("/admin/appointment-action")}
          >
          <CalendarCheck2 className="h-4 w-4" />
          预约处理
          </Link>
      
        <button
          type="button"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-white/75 transition hover:bg-white/10"
          disabled
        >
          <Settings className="h-4 w-4" />
          设置
        </button>
      </nav>
    </aside>
  );
}
