import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="viz-root relative min-h-full overflow-hidden">
      <style>{`
        .viz-root {
          color-scheme: light;
          --page-plane: #f9f9f7;
          --surface-1: #ffffff;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --text-muted: #898781;
          --gridline: #e1e0d9;
          --baseline: #c3c2b7;
          --border: rgba(11,11,11,0.08);
          --series-1: #4a3aa7;
          --series-1-soft: rgba(74,58,167,0.10);
          --status-good: #0ca30c;
          --status-good-soft: rgba(12,163,12,0.12);
          --status-warning: #fab219;
          --status-warning-soft: rgba(250,178,25,0.14);
          background: var(--page-plane);
        }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .viz-root {
            color-scheme: dark;
            --page-plane: #0d0d0d;
            --surface-1: #17171a;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --text-muted: #898781;
            --gridline: #2c2c2a;
            --baseline: #383835;
            --border: rgba(255,255,255,0.10);
            --series-1: #9085e9;
            --series-1-soft: rgba(144,133,233,0.14);
            --status-good: #0ca30c;
            --status-good-soft: rgba(12,163,12,0.16);
            --status-warning: #fab219;
            --status-warning-soft: rgba(250,178,25,0.16);
          }
        }
        :root[data-theme="dark"] .viz-root {
          color-scheme: dark;
          --page-plane: #0d0d0d;
          --surface-1: #17171a;
          --text-primary: #ffffff;
          --text-secondary: #c3c2b7;
          --text-muted: #898781;
          --gridline: #2c2c2a;
          --baseline: #383835;
          --border: rgba(255,255,255,0.10);
          --series-1: #9085e9;
          --series-1-soft: rgba(144,133,233,0.14);
          --status-good: #0ca30c;
          --status-good-soft: rgba(12,163,12,0.16);
          --status-warning: #fab219;
          --status-warning-soft: rgba(250,178,25,0.16);
        }
      `}</style>

      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--brand-magenta)]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-blob-delay pointer-events-none absolute top-0 right-[-8%] h-96 w-96 rounded-full bg-[var(--brand-purple)]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white/70 px-5 py-4 backdrop-blur-md dark:bg-white/5"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="bg-brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-transform hover:scale-105"
              aria-label="Back to AssistFlow home"
            >
              A
            </Link>
            <div>
              <h1 className="text-xl font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                Analytics
              </h1>
              <p className="text-sm leading-tight" style={{ color: "var(--text-secondary)" }}>
                Live from Airtable — Conversations, Tickets &amp; Feedback
              </p>
            </div>
          </div>
          <RefreshButton />
        </header>

        {errorMessage ? (
          <div
            className="mt-8 flex items-start gap-3 rounded-2xl border p-6 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}
          >
            <WarningIcon />
            <span>{errorMessage}</span>
          </div>
        ) : (
          snapshot && <DashboardBody snapshot={snapshot} />
        )}
      </div>
    </div>
  );
}

function DashboardBody({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  return (
    <>
      {snapshot.unavailableTables.length > 0 && (
        <div
          className="mt-6 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm"
          style={{
            borderColor: "var(--border)",
            background: "var(--status-warning-soft)",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ color: "var(--status-warning)" }}>
            <WarningIcon />
          </span>
          <span>
            <strong style={{ color: "var(--text-primary)" }}>
              {snapshot.unavailableTables.join(", ")}
            </strong>{" "}
            {snapshot.unavailableTables.length === 1 ? "table isn't" : "tables aren't"} set up in
            Airtable yet — related metrics show as 0 below. Everything else is live data. See{" "}
            <code className="text-xs">docs/phase-9-analytics.md</code>.
          </span>
        </div>
      )}

      <section className="mt-8">
        <SectionEyebrow>Conversations</SectionEyebrow>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={<ChatIcon />}
            iconTone="brand"
            label="Total conversations"
            value={formatCompact(snapshot.totalConversations)}
          />
          <StatTile
            icon={<CheckIcon />}
            iconTone="good"
            label="AI resolved"
            value={formatCompact(snapshot.aiResolved)}
          />
          <StatTile
            icon={<AgentIcon />}
            iconTone="warning"
            label="Human handoffs"
            value={formatCompact(snapshot.humanHandoffs)}
          />
          <StatTile
            icon={<GaugeIcon />}
            iconTone="brand"
            label="AI resolution rate"
            value={`${snapshot.aiResolutionRate.toFixed(1)}%`}
            highlight
          />
        </div>
      </section>

      <section className="mt-10">
        <SectionEyebrow>Support operations</SectionEyebrow>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={<TicketIcon />} iconTone="muted" label="Total tickets" value={formatCompact(snapshot.totalTickets)} />
          <StatTile icon={<ClockIcon />} iconTone="warning" label="Open tickets" value={formatCompact(snapshot.openTickets)} />
          <StatTile icon={<CheckIcon />} iconTone="good" label="Resolved tickets" value={formatCompact(snapshot.resolvedTickets)} />
          <StatTile icon={<TrendIcon />} iconTone="brand" label="Sales leads" value={formatCompact(snapshot.salesLeads)} />
        </div>
      </section>

      <section className="mt-10">
        <SectionEyebrow>Satisfaction</SectionEyebrow>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2">
          <StatTile
            icon={<StarIcon />}
            iconTone="brand"
            label="Customer satisfaction (CSAT)"
            value={
              snapshot.customerSatisfaction === null
                ? "No ratings yet"
                : `${snapshot.customerSatisfaction.toFixed(1)} / 5`
            }
            sublabel={
              snapshot.feedbackCount > 0
                ? `from ${snapshot.feedbackCount} rating${snapshot.feedbackCount === 1 ? "" : "s"}`
                : undefined
            }
            highlight
          />
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top support categories" icon={<ChartBarIcon />}>
          <TopCategoriesChart data={snapshot.topCategories} />
        </ChartCard>
        <ChartCard title="Ticket status" icon={<PieIcon />}>
          <TicketStatusBar open={snapshot.openTickets} resolved={snapshot.resolvedTickets} />
        </ChartCard>
      </section>
    </>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-semibold tracking-wide uppercase"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </h2>
  );
}

const ICON_TONE_STYLES: Record<string, { bg: string; fg: string }> = {
  brand: { bg: "var(--series-1-soft)", fg: "var(--series-1)" },
  good: { bg: "var(--status-good-soft)", fg: "var(--status-good)" },
  warning: { bg: "var(--status-warning-soft)", fg: "var(--status-warning)" },
  muted: { bg: "var(--gridline)", fg: "var(--text-secondary)" },
};

function StatTile({
  icon,
  iconTone,
  label,
  value,
  sublabel,
  highlight,
}: {
  icon: React.ReactNode;
  iconTone: keyof typeof ICON_TONE_STYLES;
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  const tone = ICON_TONE_STYLES[iconTone];
  return (
    <div
      className="group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-1)",
        boxShadow: highlight ? "0 8px 24px -12px var(--series-1-soft)" : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {icon}
        </span>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
      </div>
      <p className="mt-3 text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border p-6 transition-shadow hover:shadow-lg hover:shadow-fuchsia-500/5"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: "var(--series-1)" }}>{icon}</span>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
      </div>
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
                className="h-full rounded-full transition-[width] duration-700 ease-out"
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
            className="transition-[width] duration-700 ease-out"
            style={{ width: `${openPct}%`, background: "var(--status-warning)" }}
            title={`Open: ${open}`}
          />
        )}
        {resolved > 0 && (
          <div
            className="transition-[width] duration-700 ease-out"
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

function iconProps() {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function ChatIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-5" />
    </svg>
  );
}
function AgentIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function GaugeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M12 12 16 8" />
      <path d="M4.6 15a9 9 0 1 1 14.8 0" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M9 6v12" strokeDasharray="2 2" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg {...iconProps()}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg {...iconProps()} fill="currentColor" stroke="none">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z" />
    </svg>
  );
}
function ChartBarIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
function PieIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg {...iconProps()} width={20} height={20}>
      <path d="m12 9 0 4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}
