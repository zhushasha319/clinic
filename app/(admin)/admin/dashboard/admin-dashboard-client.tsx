"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "@/lib/actions/admin/dashboard.actions";
import DashboardCharts from "./dashboard-charts";
import { useTranslations } from "@/hooks/useTranslations";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type AdminDashboardClientProps = DashboardData;

export default function AdminDashboardClient({
  totalRevenue,
  appointmentCount,
  lineData,
  pieData,
  tableRows,
}: AdminDashboardClientProps) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("admin.dashboard.totalRevenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {currency.format(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("admin.dashboard.appointmentCount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {appointmentCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <h3 className="text-base font-semibold text-foreground">
            {t("admin.dashboard.revenueTrend")}
          </h3>
          <h3 className="text-base font-semibold text-foreground">
            {t("admin.dashboard.departmentRevenue")}
          </h3>
        </div>
        <DashboardCharts lineData={lineData} pieData={pieData} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("admin.dashboard.recentTransactions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-background-1 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">
                    {t("admin.dashboard.transactionDate")}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {t("admin.dashboard.appointmentDate")}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {t("admin.dashboard.doctor")}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {t("admin.dashboard.department")}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {t("admin.dashboard.patient")}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {t("admin.dashboard.amount")}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {t("admin.dashboard.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border-b px-3 py-6 text-center text-sm text-muted-foreground"
                    >
                      {t("admin.dashboard.noTransactions")}
                    </td>
                  </tr>
                ) : (
                  tableRows.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b px-3 py-3">
                        {item.transactionDate}
                      </td>
                      <td className="border-b px-3 py-3">
                        {item.appointmentDate}
                      </td>
                      <td className="border-b px-3 py-3">{item.doctorName}</td>
                      <td className="border-b px-3 py-3">{item.specialty}</td>
                      <td className="border-b px-3 py-3">{item.patientName}</td>
                      <td className="border-b px-3 py-3">
                        {currency.format(item.amount)}
                      </td>
                      <td className="border-b px-3 py-3">
                        <Badge
                          variant={item.badgeVariant}
                          className="capitalize"
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
