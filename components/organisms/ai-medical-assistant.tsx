"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIConsultationResult } from "@/components/molecules/ai-consultation-result";
import { useTranslations } from "@/hooks/useTranslations";
import { Bot, Send, RotateCcw, Loader2 } from "lucide-react";
import type { ConsultationResult } from "@/lib/ai/consultation";

export function AIMedicalAssistant() {
  const t = useTranslations("aiAssistant");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = symptoms.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: trimmed }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || t("error"));
        return;
      }

      setResult(data.data as ConsultationResult);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [symptoms, loading, t]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setError(null);
    setSymptoms("");
  }, []);

  const handleSelectDepartment = useCallback(
    (departmentId: string) => {
      // 关闭 Dialog
      setOpen(false);

      // 使用 URL 参数触发科室弹窗，并滚动到科室区域
      router.push(`/?dept=${departmentId}#our-departments`, { scroll: false });

      // 延迟滚动，等 Dialog 关闭动画完成
      setTimeout(() => {
        const el = document.getElementById("our-departments");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    },
    [router],
  );

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // 关闭时重置状态
      setResult(null);
      setError(null);
      setSymptoms("");
      setLoading(false);
    }
  }, []);

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
        aria-label={t("buttonLabel")}
      >
        <Bot className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">
          {t("buttonLabel")}
        </span>
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5 text-blue-600" />
              {t("title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {t("disclaimer")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* 结果展示 或 输入区域 */}
            {result ? (
              <>
                <AIConsultationResult
                  result={result}
                  onSelectDepartment={handleSelectDepartment}
                />
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t("retry")}
                </Button>
              </>
            ) : (
              <>
                {/* 输入区 */}
                <div>
                  <Textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder={t("inputPlaceholder")}
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        handleSubmit();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {symptoms.length}/500
                  </p>
                </div>

                {/* 错误信息 */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                {/* 提交按钮 */}
                <Button
                  onClick={handleSubmit}
                  disabled={!symptoms.trim() || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("analyzing")}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t("submit")}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
