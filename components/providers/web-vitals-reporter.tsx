"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalsPayload = {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating?: string;
  navigationType?: string;
  pathname: string;
  search: string;
  userAgent: string;
  timestamp: number;
};

const rawSampleRate = Number.parseFloat(
  process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE ?? "1",
);
const sampleRate = Number.isFinite(rawSampleRate)
  ? Math.min(Math.max(rawSampleRate, 0), 1)
  : 1;

function sendMetric(payload: WebVitalsPayload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const isQueued = navigator.sendBeacon(
      "/api/vitals",
      new Blob([body], { type: "application/json" }),
    );
    if (isQueued) {
      return;
    }
  }

  void fetch("/api/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (Math.random() > sampleRate) {
      return;
    }

    sendMetric({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating,
      navigationType: metric.navigationType,
      pathname: window.location.pathname,
      search: window.location.search,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  });

  return null;
}
