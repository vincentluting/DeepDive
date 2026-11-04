"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, X, Send, Maximize2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { MessageBubble } from "./message-bubble";
import { CoachPersonaSettings } from "./coach-persona-settings";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { CoachMessage } from "@/lib/db/coach-messages";

interface CoachCompanionProps {
  locale: string;
}

interface PersonaValues {
  coachingStyle: "supportive" | "balanced" | "challenging";
  communicationStyle: "warm" | "professional";
  responseDetail: "brief" | "balanced" | "thorough";
}

// Routes where the companion should be hidden
const HIDDEN_ROUTES = [
  "/", // landing page (exact match)
  "/quickdive",
  "/deepdive",
  "/coaching", // full coaching page (will be replaced by companion)
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function shouldHideOnRoute(pathname: string, locale: string): boolean {
  // Strip locale prefix: /en/dashboard → /dashboard
  const path = pathname.replace(`/${locale}`, "") || "/";
  return HIDDEN_ROUTES.some((route) =>
    route === "/" ? path === "/" : path.startsWith(route),
  );
}

export function CoachCompanion({ locale }: CoachCompanionProps) {
  const cc = getDictionaryClient(locale as "en" | "zh").coachCompanion;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [personaValues, setPersonaValues] = useState<PersonaValues | null>(
    null,
  );
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [streamingResponse, setStreamingResponse] = useState("");
  const welcomeTriggered = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tracks whether the component is still mounted; prevents setState-after-
  // unmount warnings and memory leaks from in-flight fetches / timers.
  // (BUG-106, 2026-04-08)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchMessages = useCallback(
    async (signal?: AbortSignal): Promise<CoachMessage[]> => {
      try {
        if (mountedRef.current) setIsLoading(true);
        const res = await fetch("/api/coach-messages", { signal });
        if (!mountedRef.current) return [];
        if (res.status === 401 || res.status === 403) {
          setIsAuthenticated(false);
          return [];
        }
        if (!res.ok) return [];
        setIsAuthenticated(true);
        const data = await res.json();
        if (!mountedRef.current) return [];
        const msgs = data.messages ?? [];
        setMessages(msgs);
        setUnreadCount(data.unreadCount ?? 0);
        return msgs;
      } catch (err) {
        // Abort is expected on unmount — not a real error.
        if ((err as { name?: string })?.name === "AbortError") return [];
        return [];
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Skip fetch entirely on routes where the companion is hidden —
    // prevents 401 noise from unauthenticated landing / QD / login pages
    // where the coach API would always reject.
    if (shouldHideOnRoute(pathname, locale)) return;

    const controller = new AbortController();
    let welcomeTimer: ReturnType<typeof setTimeout> | null = null;
    fetchMessages(controller.signal).then((msgs) => {
      if (!mountedRef.current) return;
      if (msgs.length === 0 && !welcomeTriggered.current) {
        welcomeTriggered.current = true;
        welcomeTimer = setTimeout(async () => {
          if (!mountedRef.current) return;
          try {
            await csrfFetch("/api/coach-messages/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trigger: "welcome" }),
              signal: controller.signal,
            });
            if (mountedRef.current) fetchMessages(controller.signal);
          } catch {
            /* silent */
          }
        }, 2000);
      }
    });
    return () => {
      controller.abort();
      if (welcomeTimer) clearTimeout(welcomeTimer);
    };
  }, [fetchMessages, pathname, locale]);

  useEffect(() => {
    // Same hidden-route guard for persona fetch.
    if (shouldHideOnRoute(pathname, locale)) return;

    const controller = new AbortController();
    fetch("/api/coach-persona", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (!mountedRef.current) return;
        if (data?.persona) setPersonaValues(data.persona);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [pathname, locale]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => fetchMessages(), 60_000);
    return () => clearInterval(interval);
  }, [fetchMessages, isAuthenticated]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamingResponse]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (unreadCount > 0) {
      csrfFetch("/api/coach-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
        .then(() => {
          setUnreadCount(0);
          setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
        })
        .catch(() => {});
    }
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [unreadCount]);

  const handleAction = useCallback(
    (url: string) => {
      setIsOpen(false);
      router.push(`/${locale}${url}`);
    },
    [locale, router],
  );

  const handleExpand = useCallback(() => {
    setIsOpen(false);
    router.push(`/${locale}/coaching`);
  }, [locale, router]);

  // Stable per-mount session id so the floating companion's multi-turn chat
  // persists as one coaching session. Bug-log #089: the coaching API requires
  // sessionId (z.string().min(1)), but the companion never sent one, so every
  // message 400'd and this flagship entry point was completely unusable.
  const sessionIdRef = useRef<string | null>(null);

  // Lightweight inline chat — stream response from coaching API
  const handleSend = useCallback(async () => {
    if (!chatInput.trim() || isSending) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setIsSending(true);
    setStreamingResponse("");

    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages);

    // Lazily mint the session id on first send. This runs only in a client
    // event handler, so there's no SSR/hydration concern (it never renders
    // into the DOM — it's request payload only).
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID();
    }

    try {
      const res = await csrfFetch("/api/coaching-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          messages: newMessages,
          round: newMessages.filter((m) => m.role === "user").length,
          maxRounds: 10,
          locale,
          reportSummary: null,
          answers: null,
          ageConfirmed: true,
        }),
      });

      if (!res.ok || !res.body) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: cc.errorUnavailable,
          },
        ]);
        setIsSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        // Strip quick replies marker before displaying
        const displayText = fullResponse
          .replace(/<<QUICK_REPLIES>>[\s\S]*?<<\/QUICK_REPLIES>>/, "")
          .trim();
        setStreamingResponse(displayText);
      }

      const finalText = fullResponse
        .replace(/<<QUICK_REPLIES>>[\s\S]*?<<\/QUICK_REPLIES>>/, "")
        .trim();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: finalText },
      ]);
      setStreamingResponse("");
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cc.errorConnection,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [chatInput, chatMessages, isSending, locale]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Don't render for unauthenticated users
  if (!isAuthenticated && !isLoading) return null;
  // Hide on specific routes
  if (shouldHideOnRoute(pathname, locale)) return null;

  const hasChatHistory = chatMessages.length > 0;

  return (
    <>
      {/* Floating button — nautilus shell with bioluminescent glow */}
      <motion.button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="coach-companion-button fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] shadow-lg shadow-[rgba(var(--primary-rgb),0.35)] transition-transform md:right-6"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        animate={
          !isOpen
            ? {
                boxShadow: [
                  "0 8px 24px rgba(var(--primary-rgb),0.25)",
                  "0 8px 32px rgba(var(--primary-rgb),0.45)",
                  "0 8px 24px rgba(var(--primary-rgb),0.25)",
                ],
              }
            : {}
        }
        transition={
          !isOpen
            ? {
                boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }
            : {}
        }
        aria-label={isOpen ? cc.closeCoach : cc.openCoach}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6 text-[var(--primary-foreground)]" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquareText className="h-6 w-6 text-[var(--primary-foreground)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* iOS-style unread badge */}
        {unreadCount > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-500 flex items-center justify-center"
          >
            <span className="text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </motion.div>
        )}
      </motion.button>

      {/* Message + Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="coach-companion-panel fixed right-4 z-50 flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 backdrop-blur-xl md:right-6 md:w-[380px]"
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[var(--primary)]/15 flex items-center justify-center">
                  <MessageSquareText className="h-4.5 w-4.5 text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {cc.title}
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Deep Dive
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <CoachPersonaSettings
                  locale={locale}
                  initialValues={personaValues}
                />
                <button
                  onClick={handleExpand}
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                  aria-label={cc.expand}
                  title={cc.expand}
                >
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages + Chat area */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-5 w-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              ) : !hasChatHistory && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    {cc.noMessages}
                  </p>
                </div>
              ) : (
                <>
                  {/* Proactive messages (when no chat history) */}
                  {!hasChatHistory &&
                    messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        locale={locale}
                        onAction={handleAction}
                      />
                    ))}

                  {/* Chat messages */}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Streaming response */}
                  {streamingResponse && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted text-foreground px-4 py-2.5">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {streamingResponse}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Typing indicator */}
                  {isSending && !streamingResponse && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                        <div className="flex gap-1">
                          <div
                            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat input */}
            <div className="border-t border-border px-3 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={cc.typeMessage}
                  className="min-h-10 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  disabled={isSending}
                />
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || isSending}
                  aria-label={cc.sendMessage}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
