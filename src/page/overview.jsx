import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatPanel from "./chatMain";
import Sidebar from "../page/sidenav";
import { useAuth } from '../context/AuthContext';

// Mock UI components - replace with your actual components
const Card = ({ children, className }) => <div className={`card ${className}`}>{children}</div>;
const CardHeader = ({ children }) => <div className="card-header">{children}</div>;
const CardTitle = ({ children }) => <h3 className="card-title">{children}</h3>;
const CardContent = ({ children }) => <div className="card-content">{children}</div>;
const Button = ({ children, variant, size, className, onClick }) => (
  <button 
    className={`btn ${variant} ${size} ${className}`}
    onClick={onClick}
  >
    {children}
  </button>
);

export default function DashboardPage() {
  // -----------------------------
  // Data
  // -----------------------------
  const [loans, setLoans] = useState([]);
  
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bynops_loans");
      if (raw) setLoans(JSON.parse(raw));
    } catch (error) {
      console.error("Error loading loans:", error);
    }
  }, []);

  // Helper function to extract numeric value from formatted strings
  const extractNumericValue = (value) => {
    if (value == null) return 0;
    
    // If it's already a number
    if (typeof value === 'number') return value;
    
    // If it's a string with $, %, commas, etc.
    if (typeof value === 'string') {
      // Remove $, commas, % signs, and other non-numeric characters except decimal point and minus sign
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    
    // Try to convert to number
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const kpis = useMemo(() => {
    // Handle both raw numbers and formatted strings for total balance
    const total = loans.reduce((sum, l) => {
      const balance = l.principalBalance;
      return sum + extractNumericValue(balance);
    }, 0);
    
    // Handle status strings case-insensitively
    const performing = loans.filter((l) => {
      const status = l.status;
      if (typeof status === 'string') {
        return status.toLowerCase() === 'performing';
      }
      return status === 'performing';
    }).length;
    
    const watchlist = loans.filter((l) => {
      const status = l.status;
      if (typeof status === 'string') {
        return status.toLowerCase() === 'watchlist' || status.toLowerCase().includes('watch');
      }
      return status === 'watchlist';
    }).length;
    
    const def = loans.filter((l) => {
      const status = l.status;
      if (typeof status === 'string') {
        return status.toLowerCase() === 'default' || status.toLowerCase().includes('default') || status.toLowerCase().includes('delinquent');
      }
      return status === 'default';
    }).length;
    
    return { total, performing, watchlist, def };
  }, [loans]);

  const topLoans = useMemo(() => {
    return [...loans]
      .filter((l) => l.principalBalance != null && l.principalBalance !== '')
      .sort((a, b) => {
        const aVal = extractNumericValue(a.principalBalance);
        const bVal = extractNumericValue(b.principalBalance);
        return bVal - aVal;
      })
      .slice(0, 5);
  }, [loans]);

  // Compact currency for tiles – avoids overflow (e.g., $561M)
  const formatCompactUSD = (n) => {
    if (n == null) return "";
    
    // If it's a formatted string with $, try to extract number first
    if (typeof n === 'string' && n.includes('$')) {
      const num = extractNumericValue(n);
      if (num > 0) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          notation: "compact",
          maximumFractionDigits: 0,
        }).format(num);
      }
      return n; // Return as-is if can't parse
    }
    
    const num = Number(n);
    if (!Number.isFinite(num)) return String(n);
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const fmtUSD = (n) => {
    if (n == null) return "-";
    
    // If it's already a formatted string with $, return as-is
    if (typeof n === 'string' && n.includes('$')) {
      return n;
    }
    
    const num = Number(n);
    if (isNaN(num)) return String(n);
    
    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  };

  // -----------------------------
  // Resizable chat (hydration-safe)
  // -----------------------------
  const [chatFrac, setChatFrac] = useState(0.33);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    try {
      const saved = parseFloat(localStorage.getItem("bynops_chat_frac") || "");
      if (Number.isFinite(saved)) {
        setChatFrac(Math.min(0.66, Math.max(0.33, saved)));
      }
    } catch (error) {
      console.error("Error loading chat fraction:", error);
    }
    setMounted(true);

    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("bynops_chat_frac", String(chatFrac));
    }
  }, [chatFrac, mounted]);

  // Drag logic
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  function beginDrag(e) {
    e.preventDefault();
    draggingRef.current = true;
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
  }
  
  function onDrag(e) {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const leftFrac = x / rect.width;
    const nextChatFrac = 1 - leftFrac;
    const clamped = Math.min(0.66, Math.max(0.33, nextChatFrac));
    setChatFrac(clamped);
  }
  
  function endDrag() {
    draggingRef.current = false;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);
  }

  // Derived widths
  const chatPct = Math.round(chatFrac * 100);
  const leftPct = 100 - chatPct;

  const leftStyle = isDesktop && mounted ? { width: `${leftPct}%` } : { width: "100%" };
  const rightStyle = isDesktop && mounted ? { width: `${chatPct}%` } : { width: "100%" };

  // Navigation functions
  const navigateToImport = () => {
    console.log("Navigate to import page");
    window.location.href = "/import";
  };

  const navigateToLoans = () => {
    console.log("Navigate to loans page");
    window.location.href = "/loans";
  };

  // Get display status with proper capitalization
  const getDisplayStatus = (status) => {
    if (!status) return 'unknown';
    if (typeof status === 'string') {
      const lower = status.toLowerCase();
      if (lower === 'performing') return 'performing';
      if (lower === 'watchlist' || lower.includes('watch')) return 'watchlist';
      if (lower === 'default' || lower.includes('default') || lower.includes('delinquent')) return 'default';
    }
    return String(status).toLowerCase();
  };
  const getUserInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };
  const {  userData } = useAuth();
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area - adjusted for sidebar width */}
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
   
        <div className="p-4 lg:p-8 w-full">

          {/* Two-pane layout on lg+; stacked on mobile */}
          <div
            ref={containerRef}
            className="relative flex flex-col lg:flex-row gap-4 lg:gap-6"
            style={{ userSelect: draggingRef.current ? "none" : "auto" }}
          >
            {/* LEFT: dashboard content */}
            <div className="space-y-6 lg:space-y-8 min-w-0 flex-1" style={leftStyle}>
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 text-left">
                  <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">
                    Portfolio Overview
                  </h1>
                  <p className="text-slate-500 text-sm lg:text-base mt-1">
                    A snapshot of your active CRE portfolio.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <button
                    onClick={navigateToImport}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  >
                    + Import Data
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Reset all imported loan data?")) {
                        localStorage.removeItem("bynops_loans");
                        window.location.reload();
                      }
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-black-600 hover:underline w-full sm:w-auto text-left sm:text-center"
                  >
                    Reset Data
                  </button>
     
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <div className="rounded-xl border bg-white p-4 lg:p-6 shadow-sm">
                  <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                    Total Balance
                  </div>
                  <div className="text-xl lg:text-2xl font-semibold">
                    {formatCompactUSD(kpis.total)}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4 lg:p-6 shadow-sm">
                  <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                    Performing
                  </div>
                  <div className="text-xl lg:text-2xl font-semibold text-emerald-600">
                    {kpis.performing}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4 lg:p-6 shadow-sm">
                  <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                    Watchlist / Default
                  </div>
                  <div className="text-xl lg:text-2xl font-semibold">
                    <span className="text-amber-600">{kpis.watchlist}</span>
                    <span className="mx-1 text-slate-400">/</span>
                    <span className="text-red-600">{kpis.def}</span>
                  </div>
                </div>
              </div>

              {/* Top 5 Largest Loans - Sleeker, more compact version */}
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50/50 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Top 5 Largest Loans
                  </h2>
                  <span className="text-xs text-slate-500">
                    {topLoans.length > 0 ? formatCompactUSD(topLoans[0]?.principalBalance) : '$0'} avg
                  </span>
                </div>
                
                {topLoans.length ? (
                  <>
                    <div className="divide-y">
                      {topLoans.map((l, idx) => {
                        const cityState = [l.city, l.state].filter(Boolean).join(", ");
                        const location = cityState || l.propertyAddress || "—";
                        const status = getDisplayStatus(l.status);
                        
                        return (
                          <div
                            key={l.id || l.loanNumber}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-xs font-medium text-slate-400 w-5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {(l.propertyName && l.propertyName.trim()) || "Unnamed Property"}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {l.loanNumber} • {location}
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-medium text-slate-800">
                                {fmtUSD(l.principalBalance)}
                              </p>
                              <p className={`text-xs capitalize ${
                                status === 'performing' ? 'text-emerald-600' : 
                                status === 'watchlist' ? 'text-amber-600' : 
                                status === 'default' ? 'text-red-600' : 'text-slate-500'
                              }`}>
                                {l.status || 'unknown'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="px-4 py-2.5 border-t bg-gray-50/30 flex justify-end">
                      <button
                        onClick={navigateToLoans}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View all {loans.length} loans →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center px-4">
                    <p className="text-slate-500 text-sm">
                      No data loaded yet.{" "}
                      <button 
                        onClick={navigateToImport}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Import a file
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider & drag handle (lg+) */}
            {isDesktop && mounted && (
              <div className="hidden lg:block w-1 relative flex-shrink-0" aria-hidden="true">
                <div className="absolute inset-y-0 left-[-0.5px] w-[1px] bg-slate-200" />
                <button
                  onMouseDown={beginDrag}
                  className="absolute top-1/2 -translate-y-1/2 -left-2 h-10 w-4 cursor-col-resize rounded border border-slate-300 bg-white shadow-sm hover:bg-slate-50 z-10"
                  title="Drag to resize chat"
                  aria-label="Resize chat panel"
                />
              </div>
            )}

            {/* RIGHT: AI chat - hidden on small screens unless toggled */}
            {isDesktop && mounted ? (
              <>           
  <div
    className="border rounded-xl lg:rounded-2xl shadow-sm bg-white overflow-hidden flex-shrink-0"
    style={{ ...rightStyle, minWidth: "280px", maxWidth: "600px" }}
  >
    
    <div className="h-[calc(100vh-8rem)] sticky top-4">
      <div className="pp-user flex justify-end items-center gap-2 mx-2 ">
        <div className="gg-icon">
          {getUserInitials(userData?.fullName)}
        </div>
        <span>{userData?.fullName || 'User'}</span>
      </div>
      <ChatPanel mode="portfolio" showWelcomeMessage={false} />
    </div>
  </div>
</>
        
            ) : (
              <div className="lg:hidden mt-6">
                <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
                  <div className="h-[400px]">
                    <ChatPanel mode="portfolio" showWelcomeMessage={false} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}