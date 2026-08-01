import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/analytics";

export async function GET() {
  try {
    const snapshot = await getAnalyticsSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Failed to load analytics snapshot:", error);
    return NextResponse.json(
      { error: "Could not load analytics right now." },
      { status: 502 },
    );
  }
}
