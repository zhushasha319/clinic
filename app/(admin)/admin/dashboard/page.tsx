
import AdminDashboardClient from "./admin-dashboard-client";
import { getAdminDashboardData } from "@/lib/actions/admin/dashboard.actions";

 
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  start?: string;
  end?: string;
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getAdminDashboardData({
    start: params?.start,
    end: params?.end,
  });
  
//日期选择器变更url日期，然后page页面从url拿到日期传给action获取数据
  return (
    <>
      {" "}
      <AdminDashboardClient {...data} />;
    </>
  );
}
