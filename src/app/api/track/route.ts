import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In production, forward to PostHog server-side API
    // For now, just acknowledge receipt
    if (process.env.NODE_ENV === "development") {
      console.log("[track]", body);
    }

    // TODO: Forward to PostHog when POSTHOG_API_KEY is set
    // const posthogKey = process.env.POSTHOG_API_KEY;
    // if (posthogKey) {
    //   await fetch("https://app.posthog.com/capture/", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       api_key: posthogKey,
    //       event: body.event,
    //       properties: { ...body.properties, timestamp: body.timestamp },
    //       distinct_id: "anonymous",
    //     }),
    //   });
    // }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
