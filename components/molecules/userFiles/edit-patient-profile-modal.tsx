"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

import type { PatientProfile } from "@/types";
import { patientProfileUpdateSchema } from "@/lib/validations/auth";
import { ProfileUpdateInput } from "@/types";

import { updateUserProfile } from "@/lib/actions/user.actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: PatientProfile;
}

// 将不同格式的日期字符串转换为 yyyy-mm-dd，供 <input type="date" /> 使用
function toDateInputValue(dateString?: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  patientData,
}: EditProfileModalProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(patientProfileUpdateSchema),
    defaultValues: {
      name: patientData?.name ?? "",
      phoneNumber: patientData?.phoneNumber ?? "",
      address: patientData?.address ?? "",
      dateOfBirth: toDateInputValue(patientData?.dateOfBirth) || undefined,
    },
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  // 弹窗打开或 patientData 变化时，重新填充表单
  React.useEffect(() => {
    if (!isOpen) return;

    reset({
      name: patientData?.name ?? "",
      phoneNumber: patientData?.phoneNumber ?? "",
      address: patientData?.address ?? "",
      dateOfBirth: toDateInputValue(patientData?.dateOfBirth) || undefined,
    });
    setServerError(null);
  }, [isOpen, patientData, reset]);

  const onSubmit = async (values: ProfileUpdateInput) => {
    setServerError(null);

    // 归一化：可选字段为空时置为 undefined（schema 期望可选）
    const payload: ProfileUpdateInput = {
      name: values.name,
      phoneNumber: values.phoneNumber,
      address: values.address?.trim() ? values.address.trim() : undefined,
      dateOfBirth: values.dateOfBirth?.trim() ? values.dateOfBirth : undefined,
    };

    const res = await updateUserProfile(payload);

    if (!res.success) {
      // 若服务端返回 fieldErrors，可选映射到 RHF：
      //（简化处理：仅显示首条错误信息）
      setServerError(res.error || res.message || "更新资料失败。");
      return;
    }

    // 成功：更新 session 名称、弹提示、关闭弹窗并刷新数据
    await updateSession({
      user: {
        name: payload.name,
      },
    });

    toast.success("资料更新成功！");
    onClose();
    router.refresh(); //鍒锋柊椤甸潰鏁版嵁
  };

  const handleCancel = () => {
    // 取消时重置为原始数据
    reset({
      name: patientData?.name ?? "",
      phoneNumber: patientData?.phoneNumber ?? "",
      address: patientData?.address ?? "",
      dateOfBirth: toDateInputValue(patientData?.dateOfBirth) || undefined,
    });
    setServerError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>编辑资料</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 姓名 */}
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              placeholder="请输入姓名"
              {...register("name")}
            />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 手机号 */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">手机号</Label>
            <Input
              id="phoneNumber"
              placeholder="请输入手机号"
              {...register("phoneNumber")}
              inputMode="tel"
            />
            {errors.phoneNumber?.message && (
              <p className="text-sm text-destructive">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* 地址 */}
          <div className="space-y-2">
            <Label htmlFor="address">地址</Label>
            <Textarea
              id="address"
              placeholder="请输入地址"
              className="min-h-[84px]"
              {...register("address")}
            />
            {errors.address?.message && (
              <p className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* 出生日期 */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">出生日期</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            {errors.dateOfBirth?.message && (
              <p className="text-sm text-destructive">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          {/* 服务端错误 */}
          {serverError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-[110px]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-[140px]">
              {isSubmitting ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

