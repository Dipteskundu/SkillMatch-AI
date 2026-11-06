"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Trash2, UserRound, X, ExternalLink, Sparkles, MessagesSquare } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { askBot, askPublicBot, fetchHistory, clearHistory } from "../../lib/chatbotApi";
import Avatar from "../common/Avatar";
import AgentOffers from "./AgentOffers";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm the JobMatch AI assistant. I can answer questions about the platform, your applications, learning plans, and job matching. How can I help you?",
  link: null,
};

const GUEST_WELCOME_MESSAGE = {
  id: "welcome-guest",
  role: "assistant",
  text: "Hi! I can answer general questions and explain JobMatch features. Sign in for personal account information or to use assistant tasks.",
  link: null,
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Chatbot() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([GUEST_WELCOME_MESSAGE]);
  const [isResponding, setIsResponding] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");

  const welcomeMessage = user ? WELCOME_MESSAGE : GUEST_WELCOME_MESSAGE;

  const scrollRef = useRef(null);

  /* ── Reset state on user change (privacy & session isolation) ──── */
  useEffect(() => {
    setMessages([user ? WELCOME_MESSAGE : GUEST_WELCOME_MESSAGE]);
    setHistoryLoaded(false);
    setSuggestionsVisible(true);
    setOpen(false);
    setTab("chat");
  }, [user]);

  /* ── Mobile menu event ────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => setMobileMenuOpen(e.detail?.open ?? false);
    window.addEventListener("skillmatch:mobile-menu", handler);
    return () => window.removeEventListener("skillmatch:mobile-menu", handler);
  }, []);

  /* ── Auto scroll ──────────────────────────────────────── */
  useEffect(() => {
    if (!open || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  /* ── Load persistent history when chatbot first opens ─── */
  useEffect(() => {
    if (!open || historyLoaded || authLoading || !user) return;

    (async () => {
      try {
        const history = await fetchHistory();
        if (history.length > 0) {
          const mapped = history.map((msg) => ({
            id: makeId(),
            role: msg.sender === "user" ? "user" : "assistant",
            text: msg.text,
            link: null,
          }));
          setMessages([WELCOME_MESSAGE, ...mapped]);
          setSuggestionsVisible(false);
        }
      } catch (_) {
        // Non-critical — keep welcome message
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, [open, historyLoaded, user, authLoading]);

  /* ── Clear chat ───────────────────────────────────────── */
  const handleClearChat = useCallback(async () => {
    if (user) {
      try {
        await clearHistory();
      } catch (_) {
        // Best-effort — clear locally regardless
      }
    }
    setMessages([{ ...welcomeMessage, id: "welcome-" + Date.now() }]);
    setSuggestionsVisible(true);
  }, [user, welcomeMessage]);

  /* ── Navigate via deep link and minimize ─────────────── */
  const handleDeepLink = useCallback(
    (path) => {
      router.push(path);
      setOpen(false);
    },
    [router]
  );

  /* ── Send a message ───────────────────────────────────── */
  const submitPrompt = useCallback(
    async (rawPrompt) => {
      const prompt = String(rawPrompt || "").trim();
      if (!prompt || isResponding) return;
      if (authLoading) {
        setPendingPrompt(prompt);
        setOpen(true);
        return;
      }

      setSuggestionsVisible(false);
      const userMsgId = makeId();
      setMessages((prev) => [...prev, { id: userMsgId, role: "user", text: prompt, link: null }]);
      setInput("");
      setOpen(true);
      setIsResponding(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const payload = user
          ? await askBot(prompt, controller.signal)
          : await askPublicBot(prompt, controller.signal);
        const assistantText = String(payload?.assistant || "").trim() ||
          "I encountered an error while processing your request. Please try again.";
        const link = payload?.link || null;
        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: "assistant", text: assistantText, link },
        ]);
      } catch (error) {
        const authRequired = error?.response?.data?.code === "AUTH_REQUIRED";
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            text: authRequired
              ? error.response.data.message
              : "I encountered an error while processing your request. Please try again.",
            link: authRequired ? { label: "Sign in", path: "/signin" } : null,
          },
        ]);
      } finally {
        clearTimeout(timeoutId);
        setIsResponding(false);
      }
    },
    [isResponding, authLoading, user]
  );

  useEffect(() => {
    if (authLoading || !pendingPrompt) return;
    const prompt = pendingPrompt;
    setPendingPrompt("");
    submitPrompt(prompt);
  }, [authLoading, pendingPrompt, submitPrompt]);

  /* ── External open event (e.g. from navbar) ──────────── */
  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      const prompt = String(e.detail?.prompt || "").trim();
      if (prompt) submitPrompt(prompt);
    };
    window.addEventListener("skillmatch:assistant-open", handler);
    return () => window.removeEventListener("skillmatch:assistant-open", handler);
  }, [submitPrompt]);

  /* ── Quick prompts ────────────────────────────────────── */
  const quickPrompts = useMemo(
    () => user
      ? [
          "How do I apply for a job?",
          "How many applications have I submitted?",
          "What is my skill gap?",
        ]
      : [
          "What can I do on JobMatch?",
          "How do I apply for a job?",
          "What does Skill Gap Detection do?",
        ],
    [user]
  );

  const handleTabChange = useCallback((nextTab) => {
    if (authLoading) return;
    if (nextTab === "offers" && !user) {
      setTab("chat");
      setSuggestionsVisible(false);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: "Please sign in first to use assistant tasks. After signing in, open Agent Offers to review and approve supported tasks.",
          link: { label: "Sign in", path: "/signin" },
        },
      ]);
      return;
    }
    setTab(nextTab);
  }, [authLoading, user]);

  /* ── Avatar ───────────────────────────────────────────── */
  const MessageAvatar = ({ role: msgRole }) =>
    msgRole === "assistant" ? (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[13px] font-bold text-white shadow">
        AI
      </div>
    ) : (
      <Avatar src={user?.photoURL} size="w-9 h-9" alt="Me" />
    );

  if (mobileMenuOpen) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 pb-6 sm:px-6 sm:pb-8">
      <div className="pointer-events-auto flex max-w-md w-full flex-col items-end gap-3">

        {/* ── Chat window ──────────────────────────────── */}
        {open && (
          <section
            className="relative flex w-[26rem] max-w-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[var(--card)] text-[var(--card-foreground)] shadow-2xl"
            style={{ maxHeight: "calc(100dvh - 7rem)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 bg-[var(--card)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6452F5] text-base font-bold text-white shadow-md">
                  AI
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-tight">JobMatch AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-[12px] font-medium text-slate-400">Online · {messages.length} messages</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <button
                  onClick={handleClearChat}
                  disabled={authLoading}
                  className="hover:text-slate-600 transition-colors"
                  aria-label="Clear chat history"
                  title="Clear chat history"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="hover:text-slate-600 transition-colors"
                  aria-label="Close assistant"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* View switcher: chat / agent offers */}
            <div className="flex shrink-0 gap-1.5 border-b border-slate-100 px-5 pb-2.5 bg-[var(--card)]">
              {[
                { id: "chat", label: "Chat", icon: MessagesSquare },
                { id: "offers", label: "Agent Offers", icon: Sparkles },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  disabled={authLoading}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all " +
                    (tab === id
                      ? "bg-[#6452F5] text-white shadow-sm"
                      : "text-slate-500 hover:bg-[var(--secondary)]")
                  }
                  aria-current={tab === id}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            {tab === "offers" && user && !authLoading ? (
              <AgentOffers />
            ) : (
            <>
            {/* Message list */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4 pt-3 bg-[var(--muted)]"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={"flex items-end gap-2.5 " + (msg.role === "assistant" ? "justify-start" : "justify-end")}
                >
                  {msg.role === "assistant" && <MessageAvatar role="assistant" />}
                  <div className={"flex flex-col gap-2 " + (msg.role === "assistant" ? "w-full overflow-hidden" : "max-w-[75%]")}>
                    <div
                      className={
                        "px-4 py-3 text-[14.5px] leading-relaxed shadow-sm " +
                        (msg.role === "assistant"
                          ? "rounded-2xl rounded-bl-sm border border-slate-200 bg-[var(--card)] text-[var(--card-foreground)]"
                          : "rounded-2xl rounded-br-sm bg-[#5A55F5] text-white")
                      }
                    >
                      {msg.text}
                    </div>

                    {/* Deep link button */}
                    {msg.role === "assistant" && msg.link && (
                      <button
                        onClick={() => handleDeepLink(msg.link.path)}
                        className="inline-flex items-center gap-1.5 self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[13px] font-medium text-indigo-700 transition-all hover:bg-indigo-100 hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {msg.link.label}
                      </button>
                    )}
                  </div>
                  {msg.role === "user" && <MessageAvatar role="user" />}
                </div>
              ))}

              {/* Typing indicator */}
              {isResponding && (
                <div className="flex items-end gap-2.5 justify-start">
                  <MessageAvatar role="assistant" />
                  <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-[var(--card)] px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-slate-100 bg-[var(--card)] px-5 py-4 shrink-0">
              {suggestionsVisible && (
                <p className="mb-3 text-[12.5px] text-slate-500 leading-relaxed">
                  Try:{" "}
                  {quickPrompts.map((qp, i) => (
                    <span key={qp}>
                      <button
                        type="button"
                        onClick={() => submitPrompt(qp)}
                        disabled={authLoading || isResponding}
                        className="bg-transparent border-0 p-0 cursor-pointer text-[#6663F6] hover:underline underline-offset-2 focus-visible:outline-none"
                      >
                        {qp}
                      </button>
                      {i < quickPrompts.length - 1 && <span className="text-slate-300 mx-1">·</span>}
                    </span>
                  ))}
                </p>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); submitPrompt(input); }}
                className="flex items-center gap-2 rounded-[1.25rem] bg-[var(--secondary)] px-4 py-2.5"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={user ? "Ask JobMatch AI..." : "Ask a general or JobMatch question..."}
                  disabled={isResponding || authLoading}
                  className="min-w-0 flex-1 bg-transparent text-[14.5px] text-[var(--foreground)] outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={isResponding || authLoading || !input.trim()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#6452F5] text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-40 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4 -ml-0.5 mt-0.5" strokeWidth={2.5} />
                </button>
              </form>
            </div>
            </>
            )}
          </section>
        )}

        {/* ── FAB button ──────────────────────────────── */}
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#6452F5] text-white shadow-2xl shadow-indigo-300/50 transition-all hover:scale-105 hover:shadow-indigo-400/60 active:scale-95"
            aria-expanded={false}
            aria-label="Open JobMatch AI assistant"
          >
            
            <span className="absolute inset-0 rounded-full bg-[#6452F5] animate-ping opacity-20 pointer-events-none" />
            <MessageCircle className="h-6 w-6 shrink-0" />
        
          </button>
        )}
      </div>
    </div>
  );
}
