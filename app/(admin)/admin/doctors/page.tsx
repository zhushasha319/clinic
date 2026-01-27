import DoctorManagementClient from "./DoctorManagementClient";
import { getDoctorList, getDepartments } from "@/lib/actions/admin/doctor-management.actions";

type SearchParams = {
  page?: string;
};

export default async function DoctorManagementPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page ?? "1") || 1);

  const [listResult, departments] = await Promise.all([
    getDoctorList({ page, limit: 5 }),
    getDepartments(),
  ]);

  return (
    <DoctorManagementClient
      rows={listResult.rows}
      totalPages={listResult.totalPages}
      currentPage={listResult.currentPage}
      departments={departments}
    />
  );
}
