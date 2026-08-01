import { ChatWidget } from "@/components/chat-widget";
import { OpenChatButton } from "@/components/open-chat-button";
import { Reveal } from "@/components/reveal";

const FEATURES = [
  {
    title: "AI Customer Support",
    description:
      "Answers customer questions instantly using your verified knowledge base — no hallucinated policies.",
  },
  {
    title: "Intent Classification",
    description:
      "Every message is classified as support, sales, billing, refund, shipping, or a technical issue.",
  },
  {
    title: "Human Handoff",
    description:
      "Complex or sensitive conversations are automatically escalated to your support team.",
  },
  {
    title: "Automatic Ticketing",
    description:
      "Billing issues and complaints become tracked tickets with priority and status, automatically.",
  },
  {
    title: "CRM Automation",
    description:
      "Every conversation updates the customer record — tags, history, and lifetime engagement.",
  },
  {
    title: "Sales Lead Detection",
    description:
      "Buying intent is flagged, tagged as a Hot Lead, and routed straight to your sales team.",
  },
  {
    title: "Email & Slack Alerts",
    description:
      "Ticket confirmations, resolutions, and urgent escalations notify the right people instantly.",
  },
  {
    title: "Support Analytics",
    description:
      "Track AI resolution rate, handoffs, response time, and CSAT from one dashboard.",
  },
];

const PIPELINE = [
  "Website Chat Widget",
  "Make.com Webhook",
  "Customer + Knowledge Base Lookup",
  "Groq AI (Intent, Answer, Handoff)",
  "Router (Support / Sales / Billing / Handoff)",
  "CRM, Tickets, Email, Slack",
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <LogoStrip />
        <Features />
        <Pipeline />
        <CTA />
      </main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-4 z-40 mx-auto w-full max-w-5xl px-4">
      <div className="flex items-center justify-between rounded-full border border-black/5 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/80">
        <div className="flex items-center gap-2">
          <div className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight">
            AssistFlow
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-300 sm:flex">
          <a href="#features" className="hover:text-neutral-900 dark:hover:text-white">
            Features
          </a>
          <a href="#pipeline" className="hover:text-neutral-900 dark:hover:text-white">
            How it works
          </a>
          <a
            href="https://make.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-900 dark:hover:text-white"
          >
            Built with Make.com
          </a>
        </nav>
        <OpenChatButton className="bg-brand-gradient rounded-full px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105" />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="animate-blob absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[var(--brand-magenta)]/25 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-blob-delay absolute -top-10 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[var(--brand-purple)]/25 blur-3xl"
      />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-neutral-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
            AI Customer Support Automation Platform
          </span>
        </Reveal>
        <Reveal delayMs={80}>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl dark:text-white">
            AI Customer Support,{" "}
            <span className="text-brand-gradient">Automated.</span>
          </h1>
        </Reveal>
        <Reveal delayMs={160}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
            AssistFlow helps businesses automate customer conversations,
            support tickets, CRM updates, and human handoffs with AI.
          </p>
        </Reveal>
        <Reveal delayMs={240}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <OpenChatButton className="bg-brand-gradient w-full rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-transform hover:scale-105 sm:w-auto" />
            <a
              href="#features"
              className="w-full rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-black/5 sm:w-auto dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"
            >
              Explore Features
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LogoStrip() {
  const items = ["Make.com", "Groq AI", "Airtable", "Google Sheets", "Gmail", "Slack"];
  return (
    <div className="border-y border-black/5 bg-neutral-50 py-6 dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Everything a real support team needs
        </h2>
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">
          Every capability below runs on a Make.com automation scenario — no
          custom backend required.
        </p>
      </Reveal>
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delayMs={i * 60}>
            <div className="group h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-fuchsia-500/10 dark:border-white/10 dark:bg-white/5">
              <div className="bg-brand-gradient mb-4 h-1.5 w-8 rounded-full opacity-70 transition-all group-hover:w-12 group-hover:opacity-100" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {f.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Pipeline() {
  return (
    <section id="pipeline" className="bg-neutral-50 py-24 dark:bg-white/5">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            How the automation pipeline works
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-300">
            One Make.com scenario handles the full conversation lifecycle.
          </p>
        </Reveal>
        <ol className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {PIPELINE.map((step, i) => (
            <Reveal key={step} delayMs={i * 60}>
              <li className="flex h-full flex-col gap-3 rounded-xl border border-black/5 bg-white p-5 transition-shadow hover:shadow-md dark:border-white/10 dark:bg-neutral-900">
                <span className="bg-brand-gradient flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {step}
                </span>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <div className="bg-brand-gradient relative overflow-hidden rounded-3xl px-8 py-16 text-center text-white sm:px-16">
          <div
            aria-hidden
            className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Try the live AI assistant
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-fuchsia-50">
            Open the chat widget in the bottom-right corner and ask about
            returns, shipping, or billing.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-black/5 py-10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-neutral-500 sm:flex-row dark:text-neutral-400">
        <span>© {new Date().getFullYear()} AssistFlow. Built with Make.com.</span>
        <span>AI Customer Support Automation Platform</span>
      </div>
    </footer>
  );
}
