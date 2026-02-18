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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const sidebarRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputContainerRef = useRef(null);

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsHistoryOpen(false);
      }
    };

    if (isHistoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHistoryOpen]);

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
    <div className="flex h-screen flex-col bg-[#f5f6f7] relative overflow-hidden">
      {/* Top Bar with Chat History */}
      <div className="flex justify-end px-4 sm:px-6 pt-4 pb-2 bg-[#f5f6f7]">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <span className="text-lg">←</span>
          Chat history
        </button>
      </div>

      {/* Scrollable Content Area - with proper height calculation */}
      <div 
        className="flex-1 overflow-y-auto px-4 sm:px-6" 
        ref={chatContainerRef}
        style={{ 
          maxHeight: 'calc(100vh - 140px)', // Adjust based on header and input height
        }}
      >
        {!hasUserMessage ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto pt-4 sm:pt-8 pb-4">
            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-[36px] font-semibold text-[#2f8f6b]">
              What can I help you with today?
            </h1>

            {/* Quick Prompts */}
            <div className="w-full mt-6 flex flex-wrap gap-2 justify-center">
              {quickAsks.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={busy}
                  className="rounded-full bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 transition border border-gray-200 shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages View */
          <div className="max-w-3xl mx-auto py-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={
                    "inline-block max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm " +
                    (m.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-gray-200 text-slate-900")
                  }
                >
                  <div className="whitespace-pre-wrap leading-relaxed break-words">
                    {m.content}
                  </div>
                  {m.role === "assistant" && m.table && (
                    <div className="mt-2">
                      <DataTable table={m.table} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="text-left">
                <div className="inline-block rounded-2xl px-4 py-3 text-sm bg-white border border-gray-200 text-slate-500">
                  Thinking…
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600 text-center">{error}</div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
            <div 
        className="flex-shrink-0 px-4 sm:px-6 pb-4 pt-2 bg-[#f5f6f7] border-t border-gray-200 w-full"
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Input */}
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={busy}
                placeholder="Ask me anything"
                className="w-full outline-none text-sm sm:text-[15px] placeholder-gray-400"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-t border-gray-100 text-xs sm:text-sm text-gray-500">
              <button className="flex items-center gap-1 sm:gap-2 hover:text-gray-700 transition">
                <span className="text-base sm:text-lg">📎</span>
                <span className="hidden sm:inline">Attach</span>
              </button>

              <div className="flex items-center gap-3 sm:gap-6">
                <button
                  onClick={() => setMessages(initialMessages)}
                  className="hover:text-gray-700 transition text-xs sm:text-sm"
                >
                  Reset
                </button>

                <button
                  onClick={() => send()}
                  disabled={busy || !input.trim()}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition disabled:opacity-40 text-sm sm:text-base"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Bottom Input - Fixed at bottom with proper positioning */}
  

      {/* Sidebar */}
      {isHistoryOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" />
          <div
            ref={sidebarRef}
            className="fixed top-0 right-0 h-full w-64 sm:w-80 bg-white shadow-xl z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                Chat history
              </h2>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {/* Chat history items will go here */}
              <p className="text-sm text-gray-500 text-center">No chat history yet</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}