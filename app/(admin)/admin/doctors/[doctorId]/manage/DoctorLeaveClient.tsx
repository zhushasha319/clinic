"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { addDays, format, startOfDay } from "date-fns";
import type { LeaveType } from "@/lib/generated/prisma";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getDoctorLeaveMonth,
  removeDoctorLeave,
  setDoctorLeave,
  type DoctorLeaveDay,
} from "@/lib/actions/admin/doctor-leave.actions";

const leaveOptions: { value: LeaveType; label: string; color: string }[] = [
  { value: "FULL_DAY", label: "全天", color: "bg-rose-100 text-rose-700" },
  { value: "MORNING", label: "上午", color: "bg-amber-100 text-amber-700" },
  { value: "AFTERNOON", label: "下午", color: "bg-blue-100 text-blue-700" },
];

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toDateKey = (value: string) => value.slice(0, 10);

const toLocalDateKey = (value: string) => {
  if (value.length <= 10) return value;
  const date = new Date(value);
  return format(date, "yyyy-MM-dd");
};

const normalizeLeaves = (items: DoctorLeaveDay[]) =>
  items.map((leave) => ({
    ...leave,
    date: toDateKey(leave.date),
  }));

const normalizeBlockedDates = (items: string[]) =>
  Array.from(new Set(items.map(toLocalDateKey)));

type DoctorLeaveClientProps = {
  doctorId: string;
  doctorName: string;
  initialMonth: Date;
  initialLeaves: DoctorLeaveDay[];
  initialBlockedDates: string[];
};

export default function DoctorLeaveClient({
  doctorId,
  doctorName,
  initialMonth,
  initialLeaves,
  initialBlockedDates,
}: DoctorLeaveClientProps) {
  const [monthDate, setMonthDate] = useState<Date>(initialMonth);
  const [leaves, setLeaves] = useState<DoctorLeaveDay[]>(
    () => normalizeLeaves(initialLeaves),
  );
  const [blockedDates, setBlockedDates] = useState<string[]>(
    () => normalizeBlockedDates(initialBlockedDates),
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<LeaveType>("FULL_DAY");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const leaveByDate = useMemo(() => {
    const map = new Map<string, LeaveType>();
    leaves.forEach((leave) => {
      map.set(leave.date, leave.type);
    });
    return map;
  }, [leaves]);

  const fullDayDates = useMemo(
    () =>
      leaves
        .filter((leave) => leave.type === "FULL_DAY")
        .map((leave) => parseDateOnly(leave.date)),
    [leaves],
  );
  const morningDates = useMemo(
    () =>
      leaves
        .filter((leave) => leave.type === "MORNING")
        .map((leave) => parseDateOnly(leave.date)),
    [leaves],
  );
  const afternoonDates = useMemo(
    () =>
      leaves
        .filter((leave) => leave.type === "AFTERNOON")
        .map((leave) => parseDateOnly(leave.date)),
    [leaves],
  );
  const blockedDateObjects = useMemo(
    () => blockedDates.map((date) => parseDateOnly(date)),
    [blockedDates],
  );
  const minSelectableDate = useMemo(
    () => addDays(startOfDay(new Date()), 1),
    [],
  );
  const disabledDays = useMemo(
    () => [{ before: minSelectableDate }, ...blockedDateObjects],
    [minSelectableDate, blockedDateObjects],
  );

  const loadMonth = (date: Date) => {
    startTransition(async () => {
      const data = await getDoctorLeaveMonth({
        doctorId,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
      setLeaves(normalizeLeaves(data.leaves));
      setBlockedDates(normalizeBlockedDates(data.blockedDates));
    });
  };

  useEffect(() => {
    loadMonth(monthDate);
  }, [monthDate]);

  const handleSelectDate = (date?: Date) => {
    if (!date) return;
    const key = format(date, "yyyy-MM-dd");
    if (blockedSet.has(key)) {
      setNotice("当天已有预约，无法请假");
      return;
    }
    setNotice(null);
    setSelectedDate(date);
    const type = leaveByDate.get(key) ?? "FULL_DAY";
    setSelectedType(type);
  };

  const handleSave = () => {
    if (!selectedDate) {
      setNotice("请先选择日期");
      return;
    }
    const date = format(selectedDate, "yyyy-MM-dd");
    startTransition(async () => {
      const res = await setDoctorLeave({
        doctorId,
        date,
        type: selectedType,
      });
      if (!res.success) {
        setNotice(res.message || "保存失败");
        return;
      }
      setNotice(null);
      await loadMonth(monthDate);
    });
  };

  const handleRemove = (date: string) => {
    startTransition(async () => {
      await removeDoctorLeave({ doctorId, date });
      await loadMonth(monthDate);
    });
  };

  const handleTypeChange = (date: string, nextType: LeaveType) => {
    startTransition(async () => {
      await setDoctorLeave({ doctorId, date, type: nextType });
      await loadMonth(monthDate);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/doctors">返回</Link>
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {doctorName} - 请假管理
        </h2>
      </div>

      <div className="rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="rounded-lg border bg-background-1 p-4">
            <Calendar
              mode="single"
              month={monthDate}
              onMonthChange={setMonthDate}
              selected={selectedDate}
              onSelect={handleSelectDate}
              disabled={disabledDays}
              modifiers={{
                fullDay: fullDayDates,
                morning: morningDates,
                afternoon: afternoonDates,
                blocked: blockedDateObjects,
              }}
              modifiersClassNames={{
                fullDay: "bg-rose-100 text-rose-700",
                morning: "bg-amber-100 text-amber-700",
                afternoon: "bg-blue-100 text-blue-700",
                blocked: "bg-gray-200 text-gray-400",
              }}
            />
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="rounded-lg border bg-background-1 p-4">
              <p className="text-sm font-semibold text-foreground">图例</p>
              <div className="mt-3 space-y-2 text-sm">
                {leaveOptions.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${option.color}`} />
                    <span>{option.label} 请假</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <span>已有预约（不可请假）</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-background-1 p-4">
              <p className="text-sm font-semibold text-foreground">设置请假</p>
              <p className="mt-2 text-xs text-muted-foreground">
                选择日期后设置请假类型
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <div className="text-sm text-foreground">
                  {selectedDate
                    ? format(selectedDate, "yyyy年M月d日")
                    : "未选择日期"}
                </div>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedType}
                  onChange={(event) =>
                    setSelectedType(event.target.value as LeaveType)
                  }
                >
                  {leaveOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button onClick={handleSave} disabled={isPending}>
                  保存
                </Button>
                {notice ? (
                  <p className="text-xs text-rose-600">{notice}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">已标记请假日期</h3>
          <Badge variant="secondary">{leaves.length} 天</Badge>
        </div>
        {leaves.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">暂无请假记录</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {leaves.map((leave) => (
              <div
                key={leave.date}
                className="flex flex-col gap-2 rounded-lg border bg-background-1 p-3"
              >
                <div className="text-sm font-medium text-foreground">
                  {format(parseDateOnly(leave.date), "yyyy年M月d日")}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                    value={leave.type}
                    onChange={(event) =>
                      handleTypeChange(leave.date, event.target.value as LeaveType)
                    }
                  >
                    {leaveOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-300 hover:bg-rose-50"
                    onClick={() => handleRemove(leave.date)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
