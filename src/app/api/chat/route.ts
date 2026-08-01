import { NextResponse } from "next/server";
import type { IncomingChatResponse, OutgoingChatPayload } from "@/lib/types";

const FALLBACK_ANSWER =
  "I'm sorry, I'm having trouble processing your request right now. I'll connect you with a support agent.";

/**
 * Proxies the widget's message to the Make.com scenario webhook.
 * Keeping this on the server means MAKE_WEBHOOK_URL never ships to the browser,
 * and lets us enforce basic validation + a safe fallback if Make/Groq is down.
 */
export async function POST(request: Request) {
  let body: Partial<OutgoingChatPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { customer_id, name, email, conversation_id, message } = body;
  if (!customer_id || !conversation_id || !message?.trim()) {
    return NextResponse.json(
      { error: "customer_id, conversation_id, and message are required." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("MAKE_WEBHOOK_URL is not configured.");
    return NextResponse.json<IncomingChatResponse>({
      answer: FALLBACK_ANSWER,
      handoff: true,
      category: "system_error",
      priority: "high",
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const makeResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id,
        name: name ?? "",
        email: email ?? "",
        conversation_id,
        message: message.trim(),
        request_human: body.request_human ?? false,
      } satisfies OutgoingChatPayload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!makeResponse.ok) {
      throw new Error(`Make.com webhook returned ${makeResponse.status}`);
    }

    const data = (await makeResponse.json()) as IncomingChatResponse;
    if (!data.answer) {
      throw new Error("Make.com webhook response missing 'answer' field.");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat webhook call failed:", error);
    return NextResponse.json<IncomingChatResponse>({
      answer: FALLBACK_ANSWER,
      handoff: true,
      category: "system_error",
      priority: "high",
    });
  }
}
