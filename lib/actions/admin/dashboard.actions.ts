"use server";

import { format, isValid, startOfDay, endOfDay, subDays } from "date-fns";
import prisma from "@/db/prisma";

export type DashboardTableRow = {
  id: string;
  transactionDate: string;
  appointmentDate: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  amount: number;
  status: string;
  badgeVariant: "default" | "destructive" | "outline" | "secondary";
};

export type DashboardData = {
  totalRevenue: number;
  appointmentCount: number;
  linePath: string;
  areaPath: string;
  lineLabels: string[];
  lineData: { label: string; value: number }[];
  donutBackground: string;
  donutSegments: { name: string; color: string }[];
  pieData: { name: string; value: number; color?: string }[];
  tableRows: DashboardTableRow[];
  initialStart: string;
  initialEnd: string;
  chartWidth: number;
  chartHeight: number;
};

const chartWidth = 600;
const chartHeight = 200;
const chartPadding = 20;

const palette = ["#60a5fa", "#34d399", "#f97316", "#a78bfa", "#facc15"];

const parseDateOnly = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const buildLinePath = (values: number[]) => {
  if (values.length === 0) return "";

  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const span = maxValue - minValue || 1;

  return values
    .map((value, index) => {
      const x =
        (index / Math.max(values.length - 1, 1)) *
          (chartWidth - chartPadding * 2) +
        chartPadding;
      const y =
        chartHeight -
        chartPadding -
        ((value - minValue) / span) * (chartHeight - chartPadding * 2);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
};

export async function getAdminDashboardData({
  start,
  end,
}: {
  start?: string;
  end?: string;
}): Promise<DashboardData> {
  const defaultEnd = new Date();
  const defaultStart = subDays(defaultEnd, 29);

  const parsedStart = parseDateOnly(start) ?? defaultStart;
  const parsedEnd = parseDateOnly(end) ?? defaultEnd;

  let rangeStart = isValid(parsedStart) ? parsedStart : defaultStart;
  let rangeEnd = isValid(parsedEnd) ? parsedEnd : defaultEnd;

  if (rangeStart > rangeEnd) {
    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
  }

  const rangeStartUtc = startOfDay(rangeStart);
  const rangeEndUtc = endOfDay(rangeEnd);

  const [appointmentCount, revenueAgg, recentTransactions, chartTransactions] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          appointmentStartUTC: {
            gte: rangeStartUtc,
            lte: rangeEndUtc,
          },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: rangeStartUtc,
            lte: rangeEndUtc,
          },
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          transactionDate: {
            gte: rangeStartUtc,
            lte: rangeEndUtc,
          },
        },
        include: {
          appointment: true,
          doctor: {
            include: {
              doctorProfile: true,
            },
          },
        },
        orderBy: { transactionDate: "desc" },
        take: 8,
      }),
      prisma.transaction.findMany({
        where: {
          transactionDate: {
            gte: rangeStartUtc,
            lte: rangeEndUtc,
          },
          status: "COMPLETED",
        },
        select: {
          amount: true,
          transactionDate: true,
          doctor: {
            select: {
              doctorProfile: {
                select: {
                  specialty: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const totalRevenue = revenueAgg._sum.amount ?? 0;

  const dailyRevenue = new Map<string, number>();
  const specialtyRevenue = new Map<string, number>();

  chartTransactions.forEach((item) => {
    const key = format(item.transactionDate, "yyyy-MM-dd");
    dailyRevenue.set(key, (dailyRevenue.get(key) ?? 0) + item.amount);

    const specialty = item.doctor.doctorProfile?.specialty ?? "全科";
    specialtyRevenue.set(
      specialty,
      (specialtyRevenue.get(specialty) ?? 0) + item.amount,
    );
  });

  const days: Date[] = [];
  const currentDay = new Date(rangeStart);
  while (currentDay <= rangeEnd) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const dailyValues = days.map(
    (day) => dailyRevenue.get(format(day, "yyyy-MM-dd")) ?? 0,
  );
  const linePath = buildLinePath(dailyValues);
  const areaPath = linePath
    ? `${linePath} L ${chartWidth - chartPadding} ${chartHeight - chartPadding} L ${chartPadding} ${chartHeight - chartPadding} Z`
    : "";

  const labelStep = Math.max(1, Math.floor(days.length / 6));
  const lineLabels = days
    .filter((_, index) => index % labelStep === 0)
    .map((day) => format(day, "M月d日"));
  const lineData = days.map((day, index) => ({
    label: format(day, "M月d日"),
    value: dailyValues[index] ?? 0,
  }));

  const departmentEntries = Array.from(specialtyRevenue.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const departmentTotal = departmentEntries.reduce(
    (sum, item) => sum + item[1],
    0,
  );

  let currentPercent = 0;
  const donutSegments = departmentEntries.map(([name, value], index) => {
    const color = palette[index % palette.length];
    const percent = departmentTotal > 0 ? (value / departmentTotal) * 100 : 0;
    const startPercent = currentPercent;
    const endPercent = currentPercent + percent;
    currentPercent = endPercent;
    return { name, value, color, start: startPercent, end: endPercent };
  });

  const donutBackground =
    donutSegments.length > 0
      ? `conic-gradient(${donutSegments
          .map(
            (segment) => `${segment.color} ${segment.start}% ${segment.end}%`,
          )
          .join(", ")})`
      : "conic-gradient(#e5e7eb 0 100%)";
  const pieData = departmentEntries.map(([name, value], index) => ({
    name,
    value,
    color: palette[index % palette.length],
  }));

  const tableRows: DashboardTableRow[] = recentTransactions.map((item) => {
    const statusLabel =
      item.status === "COMPLETED"
        ? "已完成"
        : item.status === "FAILED"
          ? "失败"
          : "已取消";
    const badgeVariant =
      item.status === "COMPLETED"
        ? ("secondary" as const)
        : item.status === "FAILED"
          ? ("destructive" as const)
          : ("outline" as const);

    return {
      id: item.id,
      transactionDate: format(item.transactionDate, "yyyy.MM.dd"),
      appointmentDate: format(
        item.appointment.appointmentStartUTC,
        "yyyy.MM.dd",
      ),
      doctorName: item.doctor.name ?? "医生",
      specialty: item.doctor.doctorProfile?.specialty ?? "全科",
      patientName: item.appointment.patientName,
      amount: item.amount,
      status: statusLabel,
      badgeVariant,
    };
  });

  return {
    totalRevenue,
    appointmentCount,
    linePath,
    areaPath,
    lineLabels,
    lineData,
    donutBackground,
    donutSegments: donutSegments.map(({ name, color }) => ({ name, color })),
    pieData,
    tableRows,
    initialStart: format(rangeStart, "yyyy-MM-dd"),
    initialEnd: format(rangeEnd, "yyyy-MM-dd"),
    chartWidth,
    chartHeight,
  };
}
