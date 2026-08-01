export type ChatRole = "customer" | "ai" | "agent" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
}

/** Payload sent from the browser to our own /api/chat route. */
export interface OutgoingChatPayload {
  customer_id: string;
  name: string;
  email: string;
  conversation_id: string;
  message: string;
  request_human?: boolean;
}

/**
 * Shape returned by the Make.com webhook (see docs/phase-1-make-groq-setup.md).
 * This mirrors the JSON the Groq model is instructed to produce.
 */
export interface IncomingChatResponse {
  answer: string;
  intent?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  handoff?: boolean;
  lead?: boolean;
  reason?: string;
}

/** Payload sent from /feedback to our own /api/feedback route. */
export interface FeedbackPayload {
  ticket_id: string;
  conversation_id: string;
  customer_id: string;
  rating?: number;
  feedback?: string;
}
