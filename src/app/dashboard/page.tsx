import type { Metadata } from "next";
import { getAnalyticsSnapshot, type AnalyticsSnapshot } from "@/lib/analytics";
import { RefreshButton } from "@/components/refresh-button";

export const metadata: Metadata = {
  title: "Analytics",
};

export const dynamic = "force-dynamic";

function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export default async function DashboardPage() {
  let snapshot: AnalyticsSnapshot | null = null;
  let errorMessage: string | null = null;

  try {
    snapshot = await getAnalyticsSnapshot();
  } catch {
    errorMessage =
      "Analytics aren't configured yet — set AIRTABLE_API_KEY and AIRTABLE_BASE_ID once the Conversations/Tickets/Feedback tables exist (see docs/phase-9-analytics.md).";
  }

  return (
    <main className="viz-root mx-auto max-w-6xl px-6 py-12">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --page-plane: #f9f9f7;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --text-muted: #898781;
          --gridline: #e1e0d9;
          --baseline: #c3c2b7;
          --border: rgba(11,11,11,0.10);
          --series-1: #4a3aa7;
          --status-good: #0ca30c;
          --status-warning: #fab219;
        }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .viz-root {
            color-scheme: dark;
            --surface-1: #1a1a19;
            --page-plane: #0d0d0d;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --text-muted: #898781;
            --gridline: #2c2c2a;
            --baseline: #383835;
            --border: rgba(255,255,255,0.10);
            --series-1: #9085e9;
            --status-good: #0ca30c;
            --status-warning: #fab219;
          }
        }
        :root[data-theme="dark"] .viz-root {
          color-scheme: dark;
          --surface-1: #1a1a19;
          --page-plane: #0d0d0d;
          --text-primary: #ffffff;
          --text-secondary: #c3c2b7;
          --text-muted: #898781;
          --gridline: #2c2c2a;
          --baseline: #383835;
          --border: rgba(255,255,255,0.10);
          --series-1: #9085e9;
          --status-good: #0ca30c;
          --status-warning: #fab219;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Analytics
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Live from Airtable — Conversations, Tickets, and Feedback.
          </p>
        </div>
        <RefreshButton />
      </div>

      {errorMessage ? (
        <div
          className="mt-8 rounded-xl border p-6 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          {errorMessage}
        </div>
      ) : (
        snapshot && <DashboardBody snapshot={snapshot} />
      )}
    </main>
  );
}

function DashboardBody({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const tiles = [
    { label: "Total conversations", value: formatCompact(snapshot.totalConversations) },
    { label: "AI resolved", value: formatCompact(snapshot.aiResolved) },
    { label: "Human handoffs", value: formatCompact(snapshot.humanHandoffs) },
    { label: "AI resolution rate", value: `${snapshot.aiResolutionRate.toFixed(1)}%` },
    { label: "Open tickets", value: formatCompact(snapshot.openTickets) },
    {
      label: "Customer satisfaction",
      value:
        snapshot.customerSatisfaction === null
          ? "No ratings yet"
          : `${snapshot.customerSatisfaction.toFixed(1)} / 5`,
    },
  ];

  return (
    <>
      {snapshot.unavailableTables.length > 0 && (
        <div
          className="mt-6 rounded-xl border p-4 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          {snapshot.unavailableTables.join(", ")}{" "}
          {snapshot.unavailableTables.length === 1 ? "table isn't" : "tables aren't"} set up in
          Airtable yet, so related metrics below show as 0 — everything else is live data. See
          docs/phase-9-analytics.md.
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <StatTile key={t.label} label={t.label} value={t.value} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total tickets" value={formatCompact(snapshot.totalTickets)} small />
        <StatTile label="Resolved tickets" value={formatCompact(snapshot.resolvedTickets)} small />
        <StatTile label="Sales leads" value={formatCompact(snapshot.salesLeads)} small />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top support categories">
          <TopCategoriesChart data={snapshot.topCategories} />
        </ChartCard>
        <ChartCard title="Ticket status">
          <TicketStatusBar open={snapshot.openTickets} resolved={snapshot.resolvedTickets} />
        </ChartCard>
      </div>
    </>
  );
}

function StatTile({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p
        className={small ? "mt-1 text-2xl font-semibold" : "mt-1 text-3xl font-semibold"}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function TopCategoriesChart({ data }: { data: { category: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No conversations logged yet.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className="flex flex-col gap-4">
      {data.map((d) => {
        const widthPct = max > 0 ? (d.count / max) * 100 : 0;
        return (
          <div key={d.category}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>{d.category}</span>
              <span style={{ color: "var(--text-primary)" }} className="font-medium">
                {d.count}
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full"
              style={{ background: "var(--gridline)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${widthPct}%`, background: "var(--series-1)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TicketStatusBar({ open, resolved }: { open: number; resolved: number }) {
  const total = open + resolved;
  if (total === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No tickets yet.
      </p>
    );
  }

  const openPct = (open / total) * 100;
  const resolvedPct = 100 - openPct;

  return (
    <div>
      <div
        className="flex h-6 w-full overflow-hidden rounded-full"
        style={{ background: "var(--gridline)", gap: "2px" }}
      >
        {open > 0 && (
          <div
            style={{ width: `${openPct}%`, background: "var(--status-warning)" }}
            title={`Open: ${open}`}
          />
        )}
        {resolved > 0 && (
          <div
            style={{ width: `${resolvedPct}%`, background: "var(--status-good)" }}
            title={`Resolved: ${resolved}`}
          />
        )}
      </div>
      <div className="mt-4 flex gap-6 text-sm">
        <Legend swatch="var(--status-warning)" label={`Open (${open})`} />
        <Legend swatch="var(--status-good)" label={`Resolved (${resolved})`} />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: swatch }} />
      {label}
    </span>
  );
}
