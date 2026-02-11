import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, ShieldCheck, Upload, Bot, Zap, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(50%_50%_at_50%_0%,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_60%)]">
      {/* Glow background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"
        />
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-50 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 backdrop-blur-md bg-white/10 border-b  shadow-sm">
  <Link to="/" className="group inline-flex items-center gap-2">
    <div className="grid h-8 w-8 place-items-center rounded-xl bg-black text-white shadow-sm">
      <span className="text-xs font-bold">Bn</span>
    </div>
    <span className="font-semibold tracking-tight">Bynops</span>
    <Sparkles className="ml-1 h-4 w-4 text-indigo-500 opacity-0 transition group-hover:opacity-100" />
  </Link>
  <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
    <a href="#features" className="hover:text-black">Features</a>
    <a href="#how" className="hover:text-black">How it works</a>
    <a href="#security" className="hover:text-black">Security</a>
  </nav>
  <div className="flex items-center gap-3">
    <Link to="/signup" className="rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:bg-white">
      Sign Up
    </Link>
  </div>
</header>

      {/* Hero */}
      <main className="mx-auto grid w-full max-w-7xl place-items-center px-6 pt-6">
        <section className="relative w-full overflow-hidden rounded-3xl border bg-white/60 p-10 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/50">
          <div className="grid items-center gap-10 md:grid-cols-2">
            {/* Copy */}
            <div className="space-y-6">
              <motion.p
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-slate-600"
              >
                <span className="inline-flex items-center gap-1 text-indigo-600"><Zap className="h-3.5 w-3.5"/>New</span>
                AI for CRE loan servicing
              </motion.p>

              <motion.h1
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.6, ease: "easeOut" }}
                className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
              >
                The fastest way to understand & act on your loan portfolio
              </motion.h1>

              <motion.p
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
                className="max-w-prose text-base text-slate-600 md:text-lg"
              >
                Import rent rolls and loan tapes in seconds, generate watchlists automatically, and chat with an assistant that actually knows your data.
              </motion.p>

              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
                className="flex flex-wrap items-center gap-3"
              >

                <Link to="/login" className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 hover:bg-white">
                Log In <ArrowRight className="h-4 w-4"/>
                </Link>
                <span className="ml-2 hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 md:inline">⌘K Command Palette</span>
              </motion.div>
            </div>

            {/* Mock window */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="relative"
            >
              <div className="rounded-2xl border bg-white shadow-lg">
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400"/>
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400"/>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/>
                  </div>
                  <div className="ml-2 text-xs text-slate-500">bynops.app — Loans</div>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-3">
                  {[
                    { k: "Total Balance", v: "$1.28B" },
                    { k: "Performing", v: "142" },
                    { k: "Watchlist", v: "9" },
                  ].map((c) => (
                    <div key={c.k} className="rounded-xl border bg-slate-50/60 p-4">
                      <div className="text-xs uppercase text-slate-500">{c.k}</div>
                      <div className="text-2xl font-semibold">{c.v}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4"/>sample-loans.xlsx</div>
                    <div>Imported • 2m ago</div>
                  </div>
                  <div className="mt-3 rounded-lg border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium">AI Watchlist Suggestions</div>
                      <div className="text-slate-500">Auto-refresh</div>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li className="flex items-center justify-between"><span>Union Industrial Park (NY)</span><span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">watchlist</span></li>
                      <li className="flex items-center justify-between"><span>Oakview Offices (GA)</span><span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">watchlist</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Floating chat chip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="absolute -bottom-5 left-6 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs shadow"
              >
                <Bot className="h-4 w-4 text-indigo-600"/> Ask: "Watchlist loans in TX over $5M"
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Logos */}
        <section aria-label="logos" className="mt-10 w-full">
          <div className="flex items-center justify-center gap-10 opacity-70">
            <span className="text-xs uppercase tracking-wider text-slate-500">Trusted by teams from</span>
            <div className="flex flex-wrap items-center gap-6 text-slate-400">
              <div className="font-semibold">Acme RE</div>
              <div className="font-semibold">Northline</div>
              <div className="font-semibold">Union</div>
              <div className="font-semibold">Crescent</div>
              <div className="font-semibold">Harbor</div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section id="features" className="mt-16 w-full">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <Upload className="h-5 w-5"/>,
                title: "One‑click .xlsx import",
                desc: "Drop in loan tapes and rent rolls. We normalize headers automatically.",
              },
              {
                icon: <BarChart3 className="h-5 w-5"/>,
                title: "Live KPIs & cohorts",
                desc: "Portfolio KPIs, watchlist cohorts, DSCR trends, and refresh as you edit.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5"/>,
                title: "Enterprise guardrails",
                desc: "Row‑level privacy, export controls, and audit trails out of the box.",
              },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-700 group-hover:bg-slate-900 group-hover:text-white">
                  {f.icon}
                </div>
                <div className="text-lg font-semibold">{f.title}</div>
                <p className="mt-1 text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-16 w-full rounded-3xl border bg-white/70 p-8 shadow-sm backdrop-blur">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">From file → portfolio insight in minutes</h2>
              <ol className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-medium text-white">1</span><div><span className="font-medium">Import your data.</span> Drag an <code>.xlsx</code> into Import.</div></li>
                <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-medium text-white">2</span><div><span className="font-medium">Review the dashboard.</span> See totals, flags, and upcoming reviews on Loans.</div></li>
                <li className="flex items-start gap-3"><span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-medium text-white">3</span><div><span className="font-medium">Ask the assistant.</span> "Top 5 by balance in TX" or "leases expiring next 90 days".</div></li>
              </ol>
              <div className="pt-2">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 hover:bg-white">
                  Explore the demo <ArrowRight className="h-4 w-4"/>
                </Link>
              </div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="text-sm font-medium">Chat with your portfolio</div>
                <div className="mt-2 rounded-lg border p-3 text-sm">
                  <div className="text-slate-500">You → <span className="text-slate-900">Watchlist loans in TX over $5M</span></div>
                  <div className="mt-2 rounded-lg bg-slate-50 p-2 text-slate-700">3 loans matched · median balance $41.8M · 2 expiring leases in 90 days</div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div className="rounded-lg border bg-slate-50/60 p-3 text-xs">
                    <div className="font-medium">Union Industrial Park</div>
                    <div className="text-slate-500">NY • $71.5M • watchlist</div>
                  </div>
                  <div className="rounded-lg border bg-slate-50/60 p-3 text-xs">
                    <div className="font-medium">Oakview Offices</div>
                    <div className="text-slate-500">GA • $28.4M • watchlist</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security callout */}
        <section id="security" className="mt-16 w-full">
          <div className="grid items-center gap-6 rounded-3xl border bg-white p-8 shadow-sm md:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold">Enterprise‑grade security</h3>
              <p className="mt-1 text-slate-600">SOC 2 controls, SSO/SAML, least‑privilege RBAC, and audit logs. Your data never leaves your tenant.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: <ShieldCheck className="h-4 w-4"/>, label: "SSO / SAML" },
                { icon: <ShieldCheck className="h-4 w-4"/>, label: "Row‑level privacy" },
                { icon: <ShieldCheck className="h-4 w-4"/>, label: "Audit logs" },
                { icon: <ShieldCheck className="h-4 w-4"/>, label: "Export controls" },
              ].map((i) => (
                <div key={i.label} className="inline-flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2">
                  <span className="text-slate-700">{i.icon}</span>
                  <span>{i.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 w-full border-t py-8 text-sm text-slate-500">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
            <div>© {new Date().getFullYear()} Bynops</div>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-slate-700">Privacy</a>
              <a href="#" className="hover:text-slate-700">Security</a>
              <a href="#" className="hover:text-slate-700">Docs</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}