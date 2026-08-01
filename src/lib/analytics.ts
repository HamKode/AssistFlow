import { listAllRecords } from "@/lib/airtable";

interface ConversationFields {
  "Conversation ID"?: string;
  Category?: string;
  Priority?: string;
  Handoff?: boolean;
  Lead?: boolean;
}

interface TicketFields {
  Status?: "Open" | "In Progress" | "Waiting for Customer" | "Resolved" | "Closed";
}

interface FeedbackFields {
  Rating?: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface AnalyticsSnapshot {
  totalConversations: number;
  aiResolved: number;
  humanHandoffs: number;
  aiResolutionRate: number;
  salesLeads: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  customerSatisfaction: number | null;
  feedbackCount: number;
  topCategories: CategoryCount[];
  /** Tables that couldn't be read (e.g. not created in Airtable yet) — their metrics show as 0/empty above rather than failing the whole dashboard. */
  unavailableTables: string[];
}

const OPEN_STATUSES = new Set(["Open", "In Progress", "Waiting for Customer"]);
const RESOLVED_STATUSES = new Set(["Resolved", "Closed"]);

/**
 * Airtable tables are independent data sources — one missing/misconfigured
 * table (e.g. Conversations not created yet) shouldn't take down metrics
 * that come from tables that *are* working (Tickets, Feedback).
 */
async function fetchTableSafely<T extends object>(
  table: string,
  unavailableTables: string[],
): Promise<T[]> {
  try {
    return await listAllRecords<T>(table);
  } catch (error) {
    console.error(`Analytics: "${table}" table unavailable, treating as empty:`, error);
    unavailableTables.push(table);
    return [];
  }
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("AIRTABLE_API_KEY / AIRTABLE_BASE_ID are not configured.");
  }

  const unavailableTables: string[] = [];
  const [conversations, tickets, feedback] = await Promise.all([
    fetchTableSafely<ConversationFields>("Conversations", unavailableTables),
    fetchTableSafely<TicketFields>("Tickets", unavailableTables),
    fetchTableSafely<FeedbackFields>("Feedback", unavailableTables),
  ]);

  const totalConversations = conversations.length;
  const humanHandoffs = conversations.filter((c) => c.Handoff === true).length;
  const aiResolved = totalConversations - humanHandoffs;
  const salesLeads = conversations.filter((c) => c.Lead === true).length;

  const categoryCounts = new Map<string, number>();
  for (const c of conversations) {
    const category = c.Category?.trim() || "Uncategorized";
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  const topCategories = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.Status && OPEN_STATUSES.has(t.Status)).length;
  const resolvedTickets = tickets.filter((t) => t.Status && RESOLVED_STATUSES.has(t.Status)).length;

  const ratings = feedback.map((f) => f.Rating).filter((r): r is number => typeof r === "number");
  const customerSatisfaction =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;

  return {
    totalConversations,
    aiResolved,
    humanHandoffs,
    aiResolutionRate: totalConversations > 0 ? (aiResolved / totalConversations) * 100 : 0,
    salesLeads,
    totalTickets,
    openTickets,
    resolvedTickets,
    customerSatisfaction,
    feedbackCount: ratings.length,
    topCategories,
    unavailableTables,
  };
}
