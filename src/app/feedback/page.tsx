import { Suspense } from "react";
import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback-form";

export const metadata: Metadata = {
  title: "Share your feedback",
};

export default function FeedbackPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-neutral-50 px-6 py-24 dark:bg-neutral-950">
      <Suspense fallback={null}>
        <FeedbackForm />
      </Suspense>
    </main>
  );
}
