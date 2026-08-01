"use client";

export const OPEN_CHAT_EVENT = "assistflow:open-chat";

export function OpenChatButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
      className={className}
    >
      Chat With AI Assistant
    </button>
  );
}
