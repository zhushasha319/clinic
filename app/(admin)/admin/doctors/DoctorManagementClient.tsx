"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PaginationControls from "@/components/molecules/PaginationControls";
import { Plus, Pencil, Trash2, Camera, Loader2 } from "lucide-react";
import {
  createDoctor,
  deleteDoctor,
  updateDoctor,
  type DoctorRow,
} from "@/lib/actions/admin/doctor-management.actions";

const emptyForm = {
  id: "",
  email: "",
  name: "",
  department: "",
  languages: "",
  specializations: "",
  brief: "",
  image: "",
};

type DoctorFormState = typeof emptyForm;

type DoctorManagementClientProps = {
  rows: DoctorRow[];
  totalPages: number;
  currentPage: number;
  departments: string[];
};

export default function DoctorManagementClient({
  rows,
  totalPages,
  currentPage,
  departments,
}: DoctorManagementClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<DoctorFormState>(emptyForm);
  const [isUploading, setUploading] = useState(false);

  const isEditing = Boolean(form.id);

  const departmentOptions = useMemo(() => {
    if (departments.length > 0) return departments;
    return ["心内科", "儿科", "骨科", "皮肤科", "全科"];
  }, [departments]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(page));
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  const openCreateModal = () => {
    setForm({ ...emptyForm, department: departmentOptions[0] ?? "" });
    setModalOpen(true);
  };

  const openEditModal = (doctor: DoctorRow) => {
    setForm({
      id: doctor.id,
      email: doctor.email,
      name: doctor.name,
      department: doctor.department,
      languages: doctor.languages.join(", "),
      specializations: doctor.specializations.join(", "),
      brief: doctor.brief,
      image: doctor.image ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const payload = {
      id: form.id,
      email: form.email.trim(),
      name: form.name.trim(),
      department: form.department,
      languages: form.languages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      specializations: form.specializations
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      brief: form.brief.trim(),
      image: form.image || null,
    };

    startTransition(async () => {
      const res = isEditing
        ? await updateDoctor(payload)
        : await createDoctor(payload);
      if (res.success) {
        setModalOpen(false);
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("确定要删除该医生吗？")) return;
    startTransition(async () => {
      const res = await deleteDoctor(id);
      if (res.success) {
        router.refresh();
      } else if (res.errorType === "HAS_APPOINTMENTS" && res.data) {
        const items = (res.data as Array<{
          id: string;
          patientName: string;
          slotDate: string;
          slotTime: string;
        }>)
          .map(
            (item) =>
              `• ${item.patientName} (${item.slotDate} ${item.slotTime})`,
          )
          .join("\n");
        window.alert(
          `该医生存在预约，无法删除：\n${items}\n如需删除，请先处理预约。`,
        );
      } else {
        window.alert(res.message || "删除失败。");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-foreground">医生管理</h2>
        <Button className="gap-2" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          添加医生
        </Button>
      </div>

      <div className="rounded-xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-background-1 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">医生</th>
                <th className="px-4 py-3 font-medium">科室</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    暂无医生
                  </td>
                </tr>
              ) : (
                rows.map((doctor) => (
                  <tr key={doctor.id} className="border-t">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {doctor.image ? (
                            <AvatarImage src={doctor.image} alt={doctor.name} />
                          ) : null}
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {doctor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{doctor.name}</p>
                          <p className="text-xs text-muted-foreground">{doctor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{doctor.department}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/doctors/${doctor.id}/manage`}>
                            管理医生
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openEditModal(doctor)}
                        >
                          <Pencil className="h-4 w-4" />
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-rose-600 border-rose-300 hover:bg-rose-50"
                          onClick={() => handleDelete(doctor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </Button>
                      </div>
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
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑医生资料" : "添加医生"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 text-xl">
                  {form.image ? (
                    <AvatarImage src={form.image} alt={form.name || "医生头像"} />
                  ) : null}
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {form.name ? form.name.charAt(0) : "D"}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`absolute inset-0 rounded-full ${
                    isUploading ? "pointer-events-none" : "cursor-pointer"
                  }`}
                >
                  <div className="absolute inset-0 bg-background-4 bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity duration-300">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute inset-0 opacity-0">
                    <UploadButton<OurFileRouter, "imageUploader">
                      endpoint="imageUploader"
                      onUploadBegin={() => setUploading(true)}
                      onClientUploadComplete={(res) => {
                        const url = res?.[0]?.url;
                        if (url) {
                          setForm((prev) => ({ ...prev, image: url }));
                        }
                        setUploading(false);
                      }}
                      onUploadError={() => {
                        setUploading(false);
                      }}
                      className="w-full h-full rounded-full"
                    />
                  </div>
                </div>

                {isUploading ? (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">医生头像</p>
                <p className="text-xs text-muted-foreground">点击上传（最大 4MB）</p>
              </div>
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium">邮箱</label>
              <Input
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="输入医生邮箱"
              />
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium">医生姓名</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="输入医生姓名"
              />
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium">科室</label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.department}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, department: event.target.value }))
                }
              >
                {departmentOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium">语言</label>
              <Input
                value={form.languages}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, languages: event.target.value }))
                }
                placeholder="如：中文, 英文"
              />
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium">擅长方向</label>
              <Input
                value={form.specializations}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, specializations: event.target.value }))
                }
                placeholder="如：心血管, 运动损伤"
              />
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium">医生简介</label>
              <Textarea
                rows={4}
                value={form.brief}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, brief: event.target.value }))
                }
                placeholder="输入医生简介"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isEditing ? "保存修改" : "添加医生"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
