"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaginationControls from "@/components/molecules/PaginationControls";
import { useDebounce } from "@/hooks/useDebounce";
import {
  markAppointmentCancelled,
  markAppointmentCompleted,
  markAppointmentNoShow,
  markCashAsPaid,
  searchAppointmentsByPatientName,
  type AppointmentRow,
} from "@/lib/actions/admin/appointment.actions";

const statusStyleMap: Record<string, string> = {
  PAYMENT_PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  BOOKING_CONFIRMED: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  NO_SHOW: "bg-orange-100 text-orange-700 border-orange-200",
  CASH: "bg-slate-100 text-slate-700 border-slate-200",
};

const actionStyles = {
  paid: "border-emerald-400 text-emerald-600 hover:bg-emerald-50",
  cancel: "border-rose-400 text-rose-600 hover:bg-rose-50",
  noshow: "border-orange-400 text-orange-600 hover:bg-orange-50",
  complete: "border-blue-400 text-blue-600 hover:bg-blue-50",
};

export default function AppointmentActionClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams?.get("q") ?? "";
  const urlPage = Math.max(
    1,
    Number(searchParams?.get("page") ?? "1") || 1,
  );
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (urlQuery !== query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(urlQuery);
    }
  }, [query, urlQuery]);

  useEffect(() => {
    if (debouncedQuery === urlQuery) return;
    const params = new URLSearchParams(searchParams?.toString());
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
      params.set("page", "1");
    } else {
      params.delete("q");
      params.set("page", "1");
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  }, [debouncedQuery, pathname, router, searchParams, urlQuery]);

  const refreshRows = useCallback(async () => {
    const data = await searchAppointmentsByPatientName({
      query: urlQuery,
      page: urlPage,
      limit: 5,
    });
    setRows(data.rows);
    setTotalPages(data.totalPages);
  }, [urlQuery, urlPage]);

  useEffect(() => {
    startTransition(async () => {
      await refreshRows();
    });
  }, [urlQuery, urlPage, refreshRows]);

  const runAction = (
    action: (id: string) => Promise<{ success: boolean }>,
    id: string,
  ) => {
    startTransition(async () => {
      const res = await action(id);
      if (res.success) {
        await refreshRows();
      }
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(page));
    if (urlQuery) {
      params.set("q", urlQuery);
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-foreground">管理预约</h2>
        <div className="w-full md:w-[320px]">
          <Input
            placeholder="搜索病人姓名"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left text-sm">
            <thead className="bg-background-1 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">医生</th>
                <th className="px-4 py-3 font-medium">病人</th>
                <th className="px-4 py-3 font-medium">电话</th>
                <th className="px-4 py-3 font-medium">预约人</th>
                <th className="px-4 py-3 font-medium">日期</th>
                <th className="px-4 py-3 font-medium">时间</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    {isPending ? "搜索中..." : "暂无匹配预约"}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3">{row.id.slice(0, 10)}</td>
                    <td className="px-4 py-3">{row.doctorName}</td>
                    <td className="px-4 py-3">{row.patientName}</td>
                    <td className="px-4 py-3">{row.phoneNumber}</td>
                    <td className="px-4 py-3">{row.bookedBy}</td>
                    <td className="px-4 py-3">{row.slotDate}</td>
                    <td className="px-4 py-3">{row.slotTime}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={statusStyleMap[row.status]}
                      >
                        {row.statusLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "CASH" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={actionStyles.paid}
                            disabled={isPending}
                            onClick={() => runAction(markCashAsPaid, row.id)}
                          >
                            标记已支付
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={actionStyles.cancel}
                            disabled={isPending}
                            onClick={() => runAction(markAppointmentCancelled, row.id)}
                          >
                            取消
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={actionStyles.noshow}
                            disabled={isPending}
                            onClick={() => runAction(markAppointmentNoShow, row.id)}
                          >
                            未就诊
                          </Button>
                        </div>
                      ) : row.status === "BOOKING_CONFIRMED" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={actionStyles.cancel}
                            disabled={isPending}
                            onClick={() => runAction(markAppointmentCancelled, row.id)}
                          >
                            取消
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={actionStyles.noshow}
                            disabled={isPending}
                            onClick={() => runAction(markAppointmentNoShow, row.id)}
                          >
                            未就诊
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={actionStyles.complete}
                            disabled={isPending}
                            onClick={() => runAction(markAppointmentCompleted, row.id)}
                          >
                            完成
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-center">
          <PaginationControls
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </div>
  );
}
