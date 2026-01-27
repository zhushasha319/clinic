import type { ReactNode } from "react";
import { format, subDays } from "date-fns";
import { AdminHead } from "./AdminHead";
import { AdminSidebar } from "./AdminSidebar";
import { requireAdmin } from "@/lib/auth-guard";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();
  const userName = session.user?.name ?? "管理员";

  const defaultEnd = new Date();
  const defaultStart = subDays(defaultEnd, 29);

  const initialStart = format(defaultStart, "yyyy-MM-dd");
  const initialEnd = format(defaultEnd, "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-background-2">
      <div className="flex min-h-screen flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 px-4 py-6 md:px-8">
          <AdminHead
            userName={userName}
            initialStart={initialStart}
            initialEnd={initialEnd}
          />
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
