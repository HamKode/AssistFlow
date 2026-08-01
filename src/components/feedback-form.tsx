"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "submitting" | "rated" | "sending-comment" | "done" | "error";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z" />
    </svg>
  );
}

export function FeedbackForm() {
  const params = useSearchParams();
  const ticketId = params.get("ticket") ?? "";
  const conversationId = params.get("conversation") ?? "";
  const customerId = params.get("customer_id") ?? "";
  const ratingParam = Number(params.get("rating"));

  const hasRequiredParams = Boolean(ticketId && conversationId && customerId);
  const validRating = ratingParam >= 1 && ratingParam <= 5;
  const canAutoSubmit = hasRequiredParams && validRating;

  const [status, setStatus] = useState<Status>(canAutoSubmit ? "submitting" : "idle");
  const [rating] = useState(canAutoSubmit ? ratingParam : 0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!canAutoSubmit) return;

    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket_id: ticketId,
        conversation_id: conversationId,
        customer_id: customerId,
        rating: ratingParam,
      }),
    })
      .then((res) => (res.ok ? setStatus("rated") : setStatus("error")))
      .catch(() => setStatus("error"));
    // Only ever run once, on the initial link click — not on every param object identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitComment(e: SubmitEvent) {
    e.preventDefault();
    setStatus("sending-comment");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          conversation_id: conversationId,
          customer_id: customerId,
          rating,
          feedback: comment.trim(),
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (!hasRequiredParams || !validRating) {
    return (
      <FeedbackCard>
        <p className="text-neutral-600 dark:text-neutral-300">
          This feedback link looks incomplete or has expired. If you&rsquo;d
          like to share feedback, please reply to the original support email.
        </p>
      </FeedbackCard>
    );
  }

  return (
    <FeedbackCard>
      <div className="flex justify-center gap-1 text-amber-400">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rating ? "" : "text-neutral-300 dark:text-neutral-700"}>
            <StarIcon filled={n <= rating} />
          </span>
        ))}
      </div>

      {status === "submitting" && (
        <p className="mt-4 text-sm text-neutral-500">Saving your rating…</p>
      )}

      {(status === "rated" || status === "sending-comment") && (
        <form onSubmit={submitComment} className="mt-6 flex flex-col gap-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Thanks for rating us! Want to tell us more? (optional)
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What went well, or what could be better?"
            rows={4}
            className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--brand-purple)] dark:border-white/10"
          />
          <button
            type="submit"
            disabled={status === "sending-comment"}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {status === "sending-comment" ? "Sending…" : "Send feedback"}
          </button>
        </form>
      )}

      {status === "done" && (
        <p className="mt-6 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Thank you — your feedback helps us improve.
        </p>
      )}

      {status === "error" && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">
          Something went wrong saving your feedback. Please try again shortly.
        </p>
      )}
    </FeedbackCard>
  );
}

function FeedbackCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
        How was your support experience?
      </h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}
