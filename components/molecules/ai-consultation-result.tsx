"use client";

import type { ConsultationResult } from "@/lib/ai/consultation";
import { useTranslations } from "@/hooks/useTranslations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Stethoscope,
  ClipboardList,
  MessageSquare,
  Lightbulb,
} from "lucide-react";

interface AIConsultationResultProps {
  result: ConsultationResult;
  onSelectDepartment: (departmentId: string) => void;
}

export function AIConsultationResult({
  result,
  onSelectDepartment,
}: AIConsultationResultProps) {
  const t = useTranslations("aiAssistant");

  const confidenceColor = (confidence: string) => {
    switch (confidence) {
      case "高":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "中":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "低":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const confidenceLabel = (confidence: string) => {
    switch (confidence) {
      case "高":
        return t("confidenceHigh");
      case "中":
        return t("confidenceMedium");
      case "低":
        return t("confidenceLow");
      default:
        return confidence;
    }
  };

  return (
    <div className="space-y-5">
      {/* 总结 */}
      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          📋 {result.summary}
        </p>
      </div>

      {/* 推荐科室 */}
      {result.departments.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            {t("recommendedDepartments")}
          </h4>
          <div className="space-y-2">
            {result.departments.map((dept) => (
              <Card
                key={dept.id}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{dept.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${confidenceColor(dept.confidence)}`}
                        >
                          {confidenceLabel(dept.confidence)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dept.reason}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onSelectDepartment(dept.id)}
                      className="shrink-0"
                    >
                      {t("selectDepartment")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            {t("noDepartmentMatch")}
          </p>
        </div>
      )}

      {/* 风险提示 */}
      {result.riskWarnings.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {t("riskWarnings")}
          </h4>
          <ul className="space-y-1">
            {result.riskWarnings.map((warning, index) => (
              <li
                key={index}
                className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1"
              >
                <span className="mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 下一步建议 */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          {t("nextSteps")}
        </h4>

        {/* 建议检查 */}
        {result.nextSteps.suggestedTests.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              🔬 {t("suggestedTests")}
            </p>
            <ul className="space-y-1">
              {result.nextSteps.suggestedTests.map((test, index) => (
                <li
                  key={index}
                  className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1"
                >
                  <span className="mt-0.5">•</span>
                  <span>{test}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 如何向医生描述 */}
        {result.nextSteps.howToDescribe && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {t("howToDescribe")}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {result.nextSteps.howToDescribe}
            </p>
          </div>
        )}

        {/* 一般建议 */}
        {result.nextSteps.generalAdvice && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              {t("generalAdvice")}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {result.nextSteps.generalAdvice}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
