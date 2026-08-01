"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import type { ChatMessage, IncomingChatResponse } from "@/lib/types";
import { OPEN_CHAT_EVENT } from "@/components/open-chat-button";

const STORAGE_KEYS = {
  customerId: "assistflow_customer_id",
  name: "assistflow_customer_name",
  email: "assistflow_customer_email",
  conversationId: "assistflow_conversation_id",
} as const;

const WELCOME_MESSAGE =
  "Hi! I'm the AssistFlow AI assistant. How can I help you today?";

function uid() {
  return crypto.randomUUID();
}

function newMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return { id: uid(), role, text, createdAt: new Date().toISOString() };
}

interface Session {
  customerId: string;
  name: string;
  email: string;
  conversationId: string;
}

/**
 * Reads a previously-onboarded identity from localStorage.
 * Only ever called on the client (the panel that reads it is closed by
 * default on first paint, so there's nothing for SSR to mismatch against).
 */
function loadStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  const name = localStorage.getItem(STORAGE_KEYS.name);
  const email = localStorage.getItem(STORAGE_KEYS.email);
  const customerId = localStorage.getItem(STORAGE_KEYS.customerId);
  if (!name || !email || !customerId) return null;
  return {
    name,
    email,
    customerId,
    conversationId: localStorage.getItem(STORAGE_KEYS.conversationId) ?? uid(),
  };
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(loadStoredSession);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    session ? [newMessage("ai", WELCOME_MESSAGE)] : [],
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [handoffActive, setHandoffActive] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Let the hero CTA (a separate client component) open this widget.
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, open);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, open);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isSending]);

  function startConversation(e: SubmitEvent) {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const next: Session = {
      customerId: uid(),
      name: formName.trim(),
      email: formEmail.trim(),
      conversationId: uid(),
    };

    localStorage.setItem(STORAGE_KEYS.customerId, next.customerId);
    localStorage.setItem(STORAGE_KEYS.name, next.name);
    localStorage.setItem(STORAGE_KEYS.email, next.email);
    localStorage.setItem(STORAGE_KEYS.conversationId, next.conversationId);

    setSession(next);
    setMessages([newMessage("ai", WELCOME_MESSAGE)]);
  }

  function startNewConversation() {
    if (!session) return;
    const fresh = uid();
    localStorage.setItem(STORAGE_KEYS.conversationId, fresh);
    setSession({ ...session, conversationId: fresh });
    setHandoffActive(false);
    setMessages([newMessage("ai", WELCOME_MESSAGE)]);
  }

  async function sendMessage(text: string, requestHuman = false) {
    if (!text.trim() || isSending) return;

    setMessages((prev) => [...prev, newMessage("customer", text.trim())]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: session?.customerId ?? "",
          name: session?.name ?? "",
          email: session?.email ?? "",
          conversation_id: session?.conversationId ?? "",
          message: text.trim(),
          request_human: requestHuman,
        }),
      });

      const data: IncomingChatResponse = await res.json();

      setMessages((prev) => [...prev, newMessage("ai", data.answer)]);
      if (data.handoff) {
        setHandoffActive(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        newMessage(
          "system",
          "I'm sorry, I'm having trouble processing your request right now. I'll connect you with a support agent.",
        ),
      ]);
      setHandoffActive(true);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex h-128 w-88 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between bg-brand-gradient px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div>
                <p className="text-sm font-semibold leading-tight">
                  AssistFlow AI
                </p>
                <p className="text-xs text-white/80 leading-tight">
                  {handoffActive ? "Connecting you with an agent…" : "Online now"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {session && (
                <button
                  onClick={startNewConversation}
                  title="Start new conversation"
                  className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <RestartIcon />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {!session ? (
            <form
              onSubmit={startConversation}
              className="flex flex-1 flex-col justify-center gap-3 px-5 py-6"
            >
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Before we start, who do we have the pleasure of helping?
              </p>
              <input
                required
                placeholder="Your name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--brand-purple)] dark:border-white/10"
              />
              <input
                required
                type="email"
                placeholder="Your email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--brand-purple)] dark:border-white/10"
              />
              <button
                type="submit"
                className="mt-1 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
              >
                Start Chat
              </button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {isSending && <TypingBubble />}
              </div>

              {handoffActive && (
                <div className="mx-4 mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  A support agent will join this conversation shortly.
                </div>
              )}

              {/* Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2 border-t border-black/10 px-3 py-3 dark:border-white/10"
              >
                <button
                  type="button"
                  onClick={() =>
                    sendMessage("I'd like to speak with a human agent.", true)
                  }
                  title="Request human agent"
                  disabled={isSending}
                  className="shrink-0 rounded-lg border border-black/10 p-2 text-neutral-500 hover:bg-black/5 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <AgentIcon />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isSending}
                  className="min-w-0 flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--brand-purple)] disabled:opacity-60 dark:border-white/10"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="shrink-0 rounded-lg bg-brand-gradient p-2 text-white transition-transform hover:scale-105 disabled:opacity-40"
                >
                  <SendIcon />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg shadow-fuchsia-500/30 transition-transform hover:scale-105"
        aria-label={isOpen ? "Close chat" : "Chat with AI assistant"}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <div className="mx-auto max-w-[85%] rounded-lg bg-neutral-100 px-3 py-1.5 text-center text-xs text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
        {message.text}
      </div>
    );
  }

  const isCustomer = message.role === "customer";
  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isCustomer
            ? "rounded-br-sm bg-brand-gradient text-white"
            : "rounded-bl-sm bg-neutral-100 text-neutral-800 dark:bg-white/10 dark:text-neutral-100"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-3 dark:bg-white/10">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
function AgentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
