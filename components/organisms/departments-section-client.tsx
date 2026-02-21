"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DepartmentCard } from "@/components/molecules/departmentCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DoctorCard } from "@/components/molecules/doctor-card";
import type { DoctorSummary } from "@/types";

type DepartmentInfo = {
  id: string;
  name: string;
  iconName: string;
  description?: string;
  aliases?: string[];
};

interface DepartmentsSectionClientProps {
  title: string;
  departments: DepartmentInfo[];
  doctors: DoctorSummary[];
  doctorsError?: string | null;
}

const normalizeText = (value: string) => value.trim();

const matchesDepartment = (
  doctor: DoctorSummary,
  department: DepartmentInfo,
) => {
  const specialty = doctor.specialty ? normalizeText(doctor.specialty) : "";
  if (!specialty) return false;
  const candidates = [department.name, ...(department.aliases ?? [])].map(
    (item) => normalizeText(item),
  );

  return candidates.some(
    (name) => name === specialty || specialty.includes(name),
  );
};

const getDisplayRating = (rating: number | null) =>
  Number.isFinite(rating) ? (rating as number) : 4.8;

const getDisplayReviewCount = (reviewCount: number | null) =>
  Number.isFinite(reviewCount) && (reviewCount as number) > 0
    ? (reviewCount as number)
    : 10;

export function DepartmentsSectionClient({
  title,
  departments,
  doctors,
  doctorsError,
}: DepartmentsSectionClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeDepartmentId, setActiveDepartmentId] = useState<string | null>(
    null,
  );

  // 监听 URL 参数 ?dept=xxx，自动打开对应科室弹窗（由 AI 助手触发）
  useEffect(() => {
    const deptParam = searchParams.get("dept");
    if (deptParam && departments.some((d) => d.id === deptParam)) {
      setActiveDepartmentId(deptParam);
      // 清除 URL 参数，避免刷新后重复弹出
      router.replace("/", { scroll: false });
    }
  }, [searchParams, departments, router]);

  const activeDepartment = useMemo(
    () => departments.find((dept) => dept.id === activeDepartmentId) ?? null,
    [departments, activeDepartmentId],
  );

  const departmentDoctors = useMemo(() => {
    if (!activeDepartment) return [];
    return doctors.filter((doctor) =>
      matchesDepartment(doctor, activeDepartment),
    );
  }, [doctors, activeDepartment]);

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        {/* Section Title */}
        <h2 className="text-2xl font-bold text-center mb-8">{title}</h2>

        {/* Departments Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {departments.slice(0, 6).map((department) => (
            <DepartmentCard
              key={department.id}
              title={department.name}
              icon={department.iconName}
              onClick={() => setActiveDepartmentId(department.id)}
            />
          ))}
        </div>
      </div>

      <Dialog
        open={Boolean(activeDepartment)}
        onOpenChange={(open) => {
          if (!open) setActiveDepartmentId(null);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {activeDepartment?.name ?? "科室"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {activeDepartment?.description ?? "暂无科室简介。"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              医生列表
            </h4>

            {doctorsError ? (
              <div className="text-sm text-red-500">{doctorsError}</div>
            ) : departmentDoctors.length === 0 ? (
              <div className="text-sm text-gray-500">暂无可展示的医生。</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentDoctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    id={doctor.id}
                    name={(doctor.name ?? "未命名医生") as string}
                    specialty={(doctor.specialty ?? "未知专科") as string}
                    rating={getDisplayRating(doctor.rating)}
                    reviewCount={getDisplayReviewCount(doctor.reviewCount)}
                    image={(doctor.imageUrl ?? "") as string}
                    className="w-full"
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
