import { NextRequest, NextResponse } from "next/server";

type WebVitalsPayload = {
  id?: string;
  name?: string;
  value?: number;
  delta?: number;
  rating?: string;
  navigationType?: string;
  pathname?: string;
  search?: string;
  userAgent?: string;
  timestamp?: number;
};

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as WebVitalsPayload;

    if (!payload.name || typeof payload.value !== "number") {
      return NextResponse.json(
        { ok: false, error: "Invalid Web Vitals payload" },
        { status: 400 },
      );
    }

    console.info("[web-vitals]", {
      id: payload.id,
      name: payload.name,
      value: payload.value,
      delta: payload.delta,
      rating: payload.rating,
      navigationType: payload.navigationType,
      pathname: payload.pathname,
      timestamp: payload.timestamp,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[web-vitals] failed to parse payload", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
