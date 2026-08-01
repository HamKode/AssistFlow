import { NextResponse } from "next/server";
import type { FeedbackPayload } from "@/lib/types";

/**
 * Proxies feedback (star rating + optional comment) to the Make.com
 * feedback scenario webhook. Same reasoning as /api/chat: keeps
 * MAKE_FEEDBACK_WEBHOOK_URL server-side and gives us a safe fallback.
 */
export async function POST(request: Request) {
  let body: Partial<FeedbackPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { ticket_id, conversation_id, customer_id } = body;
  if (!ticket_id || !conversation_id || !customer_id) {
    return NextResponse.json(
      { error: "ticket_id, conversation_id, and customer_id are required." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.MAKE_FEEDBACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("MAKE_FEEDBACK_WEBHOOK_URL is not configured.");
    return NextResponse.json({ error: "Feedback is not configured yet." }, { status: 503 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const makeResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket_id,
        conversation_id,
        customer_id,
        rating: body.rating,
        feedback: body.feedback ?? "",
      } satisfies FeedbackPayload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!makeResponse.ok) {
      throw new Error(`Make.com feedback webhook returned ${makeResponse.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback webhook call failed:", error);
    return NextResponse.json({ error: "Could not save feedback right now." }, { status: 502 });
  }
}
