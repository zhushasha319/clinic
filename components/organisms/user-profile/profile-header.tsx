"use client";
import { PatientProfile } from "@/types";
import { UploadButton } from "@uploadthing/react";
import { updateProfileImage } from "../../../lib/actions/user.actions";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  patientData: PatientProfile;
  appointmentId?: string;
}

export default function ProfileHeader({
  patientData,
}: // appointmentId,
ProfileHeaderProps) {
  // --- 状态与 Hooks ---
  const { data: session, update: updateSession } = useSession();
  const [currentImage, setCurrentImage] = useState<string | undefined>(
    patientData.image,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadError = (error: Error) => {
    toast.error(`上传失败：${error.message}`);
    setIsProcessing(false);
  };

  // --- 渲染 ---
  return (
    <div className="flex items-center gap-6 mb-10 md:mb-12">
      {/* 头像与上传按钮容器 */}
      <div className="relative group">
        <Avatar className="w-24 h-24 text-3xl">
          {currentImage ? (
            <AvatarImage
              src={currentImage}
              alt={patientData.name || "头像"}
            />
          ) : null}
          <AvatarFallback className="bg-blue-100 text-blue-600">
            {patientData.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div
          className={`aboslute inset-0 rounded-full ${
            isProcessing ? "pointer-events-none" : "cursor-pointer"
          }`}
        >
          <div className="absolute inset-0 bg-background-4 bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity duration-300">
            <Camera className="h-8 w-8 text-white " />
          </div>
          {/* 隐藏的 UploadThing 按钮 */}
          <div className="absolute inset-0 opacity-0">
            <UploadButton<OurFileRouter, "imageUploader">
              endpoint="imageUploader"
              onUploadBegin={() => setIsProcessing(true)}
              onClientUploadComplete={async (res) => {
                if (!res || res.length === 0) {
                  toast.error("上传失败，请稍后再试。");
                  setIsProcessing(false);
                  return;
                }
                const newImageUrl = res[0].url;

                // 调用服务端 action 更新数据库中的头像
                const response = await updateProfileImage(newImageUrl);

                if (response.success) {
                  // 预加载新头像，避免闪烁
                  const img = new window.Image();
                  img.src = newImageUrl;
                  img.onload = async () => {
                    // 更新本地状态展示新头像
                    setCurrentImage(newImageUrl);

                    // 更新 NextAuth session，让全站同步头像
                    await updateSession({
                      ...session,
                      user: { ...session?.user, image: newImageUrl },
                    });

                    toast.success("头像更新成功！");
                    setIsProcessing(false);
                  };
                  img.onerror = () => {
                    toast.error(
                      "上传图片失败，请重试。",
                    );
                    setIsProcessing(false);
                  };
                } else {
                  toast.error(
                    response.message ||
                      "更新头像失败，请重试。",
                  );
                  setIsProcessing(false);
                  return;
                }
              }}
              onUploadError={handleUploadError}
              className="w-full h-full rounded-full"
            />
          </div>
        </div>

        {/* 加载中遮罩 */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* 用户名 */}
      <h2 className="text-text-title">{patientData.name}</h2>
    </div>
  );
}


