"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [justRefreshed, setJustRefreshed] = useState(false);

  return (
    <button
      onClick={() => {
        startTransition(() => router.refresh());
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 1500);
      }}
      disabled={isPending}
      className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
    >
      {isPending ? "Refreshing…" : justRefreshed ? "Refreshed" : "Refresh"}
    </button>
  );
}
