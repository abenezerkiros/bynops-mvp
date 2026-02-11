import React, { useEffect, useMemo, useRef, useState } from "react";

// Mock UI components - replace with your actual components
const Button = ({ children, onClick, disabled, size, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`btn ${size} ${className}`}
  >
    {children}
  </button>
);

const Input = ({ placeholder, value, onChange, onKeyDown, disabled, className }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    disabled={disabled}
    className={`input ${className}`}
  />
);

// 🔹 Portfolio vs loan quick prompts
const PORTFOLIO_QUICK_ASKS = [
  "Which loans should be on watchlist?",
  "Show loans with maturities in the next 12 months",
  "Which loans look most at risk if cap rates rise 100 bps?",
  "Top 5 loans by balance",
];

const LOAN_QUICK_ASKS = [
  "Summarize the key risks on this loan",
  "What happens if the largest tenant vacates?",
  "Is this more likely to be a workout or a refinance?",
  "What are three questions I should ask the borrower?",
];

const fmtUSD = (n) => {
  const num =
    typeof n === "string" ? Number(n.replace(/[,$]/g, "")) : n;
  return Number.isFinite(num)
    ? num.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    : String(n ?? "");
};

function DataTable({ table }) {
  if (!table) return null;
  
  return (
    <div className="mt-2 border rounded-lg overflow-hidden">
      {table.title && (
        <div className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 border-b">
          {table.title}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {table.columns.map((c, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 text-slate-600 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, ri) => (
              <tr key={ri} className="border-t">
                {r.map((cell, ci) => {
                  const header = table.columns[ci]?.toLowerCase() || "";
                  const isMoney =
                    header.includes("balance") || header.includes("amount");
                  return (
                    <td
                      key={ci}
                      className={
                        "px-3 py-2 whitespace-nowrap " +
                        (isMoney ? "text-right tabular-nums" : "")
                      }
                    >
                      {isMoney ? fmtUSD(cell) : String(cell ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 🔹 Now includes `mode` and `showWelcomeMessage` prop
export default function ChatPanel({ initialContext, mode = "portfolio", showWelcomeMessage = true }) {
  const [_ctx] = useState(initialContext ?? {});
  
  // Initialize messages based on showWelcomeMessage prop
  const initialMessages = showWelcomeMessage ? [{
    role: "assistant",
    content:
      mode === "loan"
        ? "Hi! I can help you think through workout options, risks, and next steps for this loan."
        : "Hi! Ask me about your portfolio (e.g., 'Which loans are at risk?', 'Show maturities in the next 12 months').",
  }] : [];
  
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  // pick quick asks based on mode
  const quickAsks = mode === "loan" ? LOAN_QUICK_ASKS : PORTFOLIO_QUICK_ASKS;

  // ✅ whether we've sent at least one user message
  const hasUserMessage = messages.some((m) => m.role === "user");

  // Grounding data from the browser session
  const loans = useMemo(() => {
    try {
      const raw = localStorage.getItem("bynops_loans");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, busy]);

  async function send(content) {
    const text = (content ?? input).trim();
    if (!text || busy) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ⬇️ Pass context so the model can focus on the selected loan if present
        body: JSON.stringify({
          messages: next,
          loans,
          context: initialContext ?? {},
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.answer ?? "Okay.",
          table: data.table ?? null,
        },
      ]);
    } catch (e) {
      setError(e?.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* header */}
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold text-slate-800">
          {mode === "loan" ? "Workout Copilot" : "Portfolio Copilot"}
        </h2>
        <p className="text-xs text-slate-500">
          {mode === "loan"
            ? "Ask about workout options, risks, and next steps."
            : "Ask about risk, watchlist, and portfolio exposures."}
        </p>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                "inline-block max-w-[92%] rounded-2xl px-3 py-2 text-sm " +
                (m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-900")
              }
            >
              <div className="leading-relaxed whitespace-pre-wrap">
                {m.content}
              </div>
              {m.role === "assistant" && m.table && (
                <DataTable table={m.table} />
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="text-left">
            <div className="inline-block rounded-2xl px-3 py-2 text-sm bg-slate-50 text-slate-500">
              Thinking…
            </div>
          </div>
        )}
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div ref={endRef} />
      </div>

      {/* ✅ quick prompts ABOVE the horizontal line, hidden after first user msg */}
      {!hasUserMessage && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {quickAsks.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={busy}
              className="rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs px-3 py-1 transition text-left"
              aria-disabled={busy}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* composer - ONLY THE SEND BUTTON AREA CHANGED */}
        {/* composer - ONLY THE SEND BUTTON AREA AND INPUT BORDER CHANGED */}
        <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={
              mode === "loan"
                ? "e.g., What are my options on this loan?"
                : "e.g., Watchlist loans in TX over $5M"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            className="text-sm flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm flex items-center gap-1"
          >
            Send
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          We only use data in your current browser session.
        </p>
      </div>
    </div>
  );
}