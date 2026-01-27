import {
  CalendarCheck2,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";

export function AdminSidebar() {
  return (
    <aside className="w-full shrink-0 bg-[color:var(--color-text-primary)] text-white md:w-64">
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
          className="flex items-center gap-3 rounded-md bg-emerald-500/30 px-3 py-2 font-medium text-white"
        >
          <LayoutDashboard className="h-4 w-4" />
          仪表盘
        </Link>
        <Link
          href="/admin/doctors"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-white/75 transition hover:bg-white/10"
        >
          <Stethoscope className="h-4 w-4" />
          医生
        </Link>
        <button
          type="button"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-white/75 transition hover:bg-white/10"
          disabled
        >
          <Link href="/admin/appointment-action" className="flex items-center gap-3">
          <CalendarCheck2 className="h-4 w-4" />
          预约处理
          </Link>
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-white/75 transition hover:bg-white/10"
          disabled
        >
          <ClipboardList className="h-4 w-4" />
          全部预约
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-white/75 transition hover:bg-white/10"
          disabled
        >
          <Users className="h-4 w-4" />
          患者
        </button>
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
