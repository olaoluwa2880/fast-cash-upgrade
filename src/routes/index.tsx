import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Home, DollarSign, LineChart, CreditCard, Contact, Calendar,
  RefreshCw, Mail, Settings, LogOut, Search, Bell, ChevronsRight,
  FileText, BarChart3, ArrowUpRight, Plus, RotateCw, Filter,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Root,
  head: () => ({
    meta: [
      { title: "FastCredit — Dashboard" },
      { name: "description", content: "FastCredit dashboard: balances, spending, cards and transactions." },
    ],
  }),
});

type Screen = "splash" | "onboarding" | "dashboard";

function Root() {
  const [screen, setScreen] = useState<Screen>("splash");
  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("onboarding"), 5000);
      return () => clearTimeout(t);
    }
  }, [screen]);
  if (screen === "splash") return <Splash />;
  if (screen === "onboarding") return <Onboarding onContinue={() => setScreen("dashboard")} />;
  return <Dashboard />;
}

function Splash() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#12b5ec]">
      <div className="flex flex-col items-center gap-4">
        <div className="text-white text-4xl font-black tracking-tight">FastCredit</div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/90 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-white/90 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-white/90 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function Onboarding({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col px-6 pt-16 pb-8">
      <div className="flex flex-col items-center">
        <div className="text-[#12b5ec] text-3xl font-black">FastCredit</div>
        <p className="mt-1 text-xs font-semibold text-[#0b1e4d]">Licensed & Secured 🛡️</p>
      </div>
      <div className="mt-8 rounded-3xl bg-[#12b5ec] aspect-square w-full flex items-center justify-center">
        <div className="text-white text-center px-6">
          <p className="text-2xl font-extrabold">Smart Credit</p>
          <p className="mt-2 text-sm opacity-90">Loans • Savings • Pools • Pay in 3</p>
        </div>
      </div>
      <h1 className="mt-6 text-center text-2xl font-extrabold text-[#0b1e4d]">
        Fast and reliable banking<br />at your fingertips
      </h1>
      <div className="mt-auto pt-6 flex flex-col gap-3">
        <button onClick={onContinue} className="w-full rounded-2xl bg-[#12b5ec] py-4 text-white font-bold">New To FastCredit</button>
        <button onClick={onContinue} className="w-full rounded-2xl border-2 border-[#12b5ec] py-4 text-[#12b5ec] font-bold">Login</button>
        <p className="text-center text-sm text-[#0b1e4d]">
          Already have a FastCredit Account?{" "}
          <button onClick={onContinue} className="text-[#12b5ec] font-semibold">Continue</button>
        </p>
      </div>
    </div>
  );
}

const CURRENCIES = [
  { code: "USD", symbol: "$", rate: 1 },
  { code: "NGN", symbol: "₦", rate: 1600 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "ZAR", symbol: "R", rate: 18.5 },
  { code: "GHS", symbol: "₵", rate: 15.1 },
  { code: "CFA", symbol: "CFA ", rate: 602 },
  { code: "GBP", symbol: "£", rate: 0.79 },
];

function Dashboard() {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [open, setOpen] = useState(false);

  const fmt = (usd: number, decimals = 2) => {
    const v = usd * currency.rate;
    return `${currency.symbol}${v.toLocaleString(undefined, {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    })}`;
  };

  const navItems = [Home, DollarSign, LineChart, CreditCard, Contact, Calendar, RefreshCw, Mail];

  return (
    <div className="min-h-screen bg-[#e9e6f7] p-2 md:p-4 text-white">
      <div className="flex gap-3">
        {/* Sidebar */}
        <aside className="hidden md:flex w-14 flex-col items-center gap-4 rounded-3xl bg-[#0b0b18] py-5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 grid place-items-center text-xs font-bold">F</div>
          {navItems.map((Icon, i) => (
            <button key={i} className={`grid h-9 w-9 place-items-center rounded-xl ${i === 0 ? "bg-white/10" : ""} text-white/60 hover:text-white`}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="mt-auto flex flex-col gap-3">
            <button className="grid h-9 w-9 place-items-center text-white/60"><Settings className="h-4 w-4" /></button>
            <button className="grid h-9 w-9 place-items-center text-white/60"><LogOut className="h-4 w-4" /></button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-300 to-pink-500" />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 rounded-3xl bg-[#0b0b18] p-4 md:p-6">
          {/* Header */}
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-sm">
              <button className="hidden md:grid h-7 w-7 place-items-center rounded-full bg-white/5"><ChevronsRight className="h-3.5 w-3.5" /></button>
              <span className="font-bold">FastCredit</span>
              <span className="text-white/40">|</span>
              <span className="text-white/70">Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setOpen(o => !o)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                  {currency.code}
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-32 rounded-xl bg-[#1a1a2e] shadow-xl z-20 overflow-hidden">
                    {CURRENCIES.map(c => (
                      <button key={c.code} onClick={() => { setCurrency(c); setOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 ${c.code === currency.code ? "font-bold text-purple-300" : ""}`}>
                        {c.symbol} {c.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="grid h-8 w-8 place-items-center rounded-full bg-white/5"><Search className="h-4 w-4" /></button>
              <button className="grid h-8 w-8 place-items-center rounded-full bg-white/5"><Bell className="h-4 w-4" /></button>
            </div>
          </header>

          {/* Grid */}
          <div className="grid grid-cols-12 gap-3">
            {/* Total balance */}
            <section className="col-span-12 lg:col-span-4 rounded-2xl bg-[#12121f] p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Total balance</p>
                <div className="flex gap-1.5 text-white/50">
                  <FileText className="h-4 w-4" /><BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{fmt(25230, 0)}</h2>
                <span className="text-xs text-white/50 mb-1">{currency.code}</span>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs">
                Earnings <span className="text-emerald-400">+12.56% ↗</span>
              </span>
              <svg viewBox="0 0 300 90" className="mt-4 w-full h-24">
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,70 C40,65 60,60 90,55 C120,50 140,45 170,30 C200,20 230,25 260,10 L300,5 L300,90 L0,90 Z" fill="url(#g1)" />
                <path d="M0,70 C40,65 60,60 90,55 C120,50 140,45 170,30 C200,20 230,25 260,10 L300,5" stroke="#c4b5fd" strokeWidth="1.5" fill="none" />
              </svg>
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
            </section>

            {/* Top spending */}
            <section className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl bg-[#12121f] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Top spending</p>
                <ArrowUpRight className="h-4 w-4 text-white/50" />
              </div>
              <div className="relative flex justify-center py-4">
                <svg viewBox="0 0 200 110" className="w-full max-w-[260px]">
                  {[
                    { r: 80, color: "#7dd3fc" },
                    { r: 65, color: "#c4b5fd" },
                    { r: 50, color: "#fbcfe8" },
                    { r: 35, color: "#fca5a5" },
                  ].map((a, i) => (
                    <path key={i} d={`M ${100 - a.r} 100 A ${a.r} ${a.r} 0 0 1 ${100 + a.r} 100`}
                      stroke={a.color} strokeWidth="6" fill="none" strokeLinecap="round" />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                  <span className="text-2xl font-extrabold">{fmt(12850, 0)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/70 mt-2">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-300" />Transport ({fmt(5140, 0)})</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-300" />Food & Dining ({fmt(3855, 0)})</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pink-300" />Clothing ({fmt(2570, 0)})</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-300" />Other ({fmt(1285, 0)})</div>
              </div>
            </section>

            {/* Cards + Upgrade */}
            <section className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl bg-[#12121f] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Cards</p>
                <ArrowUpRight className="h-4 w-4 text-white/50" />
              </div>
              <div className="mt-3 flex gap-3">
                <div className="flex-1 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 p-3 text-white">
                  <p className="text-xs">Europe Bank</p>
                  <p className="mt-4 text-sm font-semibold tracking-widest">8765 5452 6612 5123</p>
                  <div className="mt-3 flex justify-between text-[10px]">
                    <div>
                      <p className="opacity-70">Card Holder Name</p>
                      <p className="font-semibold">Edward Adams</p>
                    </div>
                    <div>
                      <p className="opacity-70">Expired Date</p>
                      <p className="font-semibold">02/30</p>
                    </div>
                  </div>
                </div>
                <button className="w-12 rounded-2xl bg-white/5 grid place-items-center text-xs font-semibold [writing-mode:vertical-rl] rotate-180">
                  Upgrade
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-full bg-white/5 py-2 text-xs font-semibold flex items-center justify-center gap-1">Top Up <RotateCw className="h-3 w-3" /></button>
                <button className="flex-1 rounded-full bg-white/5 py-2 text-xs font-semibold flex items-center justify-center gap-1">Upgrade <RotateCw className="h-3 w-3" /></button>
              </div>
            </section>

            {/* Budget */}
            <section className="col-span-12 lg:col-span-4 rounded-2xl bg-[#12121f] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Budget</p>
                <button className="rounded-md bg-white/5 px-2 py-1 text-xs">Week ▾</button>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2 h-32">
                {[
                  [50, 30], [70, 40], [40, 60], [80, 35], [55, 45], [65, 30], [45, 55],
                ].map(([a, b], i) => (
                  <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                    <div className="w-full bg-violet-300/70 rounded-t" style={{ height: `${a}%` }} />
                    <div className="w-full bg-white/20 rounded-t" style={{ height: `${b}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mt-1">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="flex gap-3 text-[10px] text-white/60 mt-3 flex-wrap">
                <span>■ Income</span><span>■ Spent</span><span>▨ Scheduled</span><span>▨ Savings</span>
              </div>
            </section>

            {/* Sales Heatmap */}
            <section className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl bg-[#12121f] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Sales Heatmap</p>
                <button className="rounded-md bg-white/5 px-2 py-1 text-xs">Week ▾</button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => {
                  const intensity = Math.random();
                  const bg = intensity > 0.75 ? "bg-violet-300" : intensity > 0.5 ? "bg-violet-400/60" : intensity > 0.25 ? "bg-white/10" : "bg-white/5";
                  return <div key={i} className={`aspect-square rounded ${bg}`} />;
                })}
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mt-2">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <span key={d}>{d}</span>)}
              </div>
            </section>

            {/* Transaction history */}
            <section className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl bg-[#12121f] p-4 row-span-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Transaction history</p>
                <Plus className="h-4 w-4 text-white/50" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-white text-black px-3 py-1 font-semibold">All</span>
                <span className="text-white/60">Income</span>
                <span className="text-white/60">Spending</span>
                <span className="ml-auto text-white/60 flex items-center gap-1">Filter <Filter className="h-3 w-3" /></span>
              </div>
              <div className="mt-3 divide-y divide-white/5">
                {[
                  { n: "Paypal", d: "8 Aug · 11:55 AM", s: "Success", a: -12.89, c: "bg-blue-500" },
                  { n: "Apple", d: "7 Aug · 8:25 AM", s: "Failure", a: -102.56, c: "bg-gray-600" },
                  { n: "Adobe Cloud", d: "6 Aug · 9:44 AM", s: "Success", a: -10.99, c: "bg-red-500" },
                  { n: "Walmart", d: "5 Aug · 10:00 PM", s: "Success", a: -59.25, c: "bg-yellow-500" },
                  { n: "Paypal", d: "4 Aug · 1:52 PM", s: "Success", a: 80.89, c: "bg-blue-500" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <div className={`h-8 w-8 rounded-full ${t.c} grid place-items-center text-xs font-bold`}>{t.n[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{t.n}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.s === "Success" ? "bg-emerald-500/20 text-emerald-300" : "bg-pink-500/20 text-pink-300"}`}>{t.s}</span>
                      </div>
                      <p className="text-[10px] text-white/40">{t.d}</p>
                    </div>
                    <span className={`text-sm font-semibold ${t.a > 0 ? "text-emerald-400" : ""}`}>
                      {t.a > 0 ? "+" : ""}{fmt(Math.abs(t.a))}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Transaction stats */}
            <section className="col-span-12 lg:col-span-4 rounded-2xl bg-[#12121f] p-4">
              <div className="flex gap-4 text-xs flex-wrap">
                <div><p className="text-white/60">● Transaction</p><p className="font-bold text-base">536 <span className="text-emerald-400 text-[10px]">+24%</span></p></div>
                <div><p className="text-white/60">● Success rate</p><p className="font-bold text-base">84%</p></div>
                <div><p className="text-white/60">● Failure</p><p className="font-bold text-base">18</p></div>
              </div>
              <svg viewBox="0 0 300 80" className="w-full h-20 mt-3">
                <polyline points="0,60 40,55 80,50 120,40 160,35 200,25 240,20 300,10"
                  stroke="#c4b5fd" strokeWidth="1.5" fill="none" />
                <line x1="220" y1="10" x2="220" y2="70" stroke="#ec4899" strokeWidth="2" />
                <line x1="260" y1="15" x2="260" y2="70" stroke="#ec4899" strokeWidth="2" />
              </svg>
              <div className="flex justify-between text-[10px] text-white/40">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <span key={d}>{d}</span>)}
              </div>
            </section>

            {/* Quick transfer */}
            <section className="col-span-12 md:col-span-6 lg:col-span-4 rounded-2xl bg-[#12121f] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Quick transfer</p>
                <ArrowUpRight className="h-4 w-4 text-white/50" />
              </div>
              <div className="mt-4 flex items-center gap-2">
                {["from-pink-400 to-rose-500","from-amber-300 to-orange-500","from-emerald-300 to-teal-500","from-sky-300 to-indigo-500","from-fuchsia-400 to-purple-500"].map((g, i) => (
                  <div key={i} className={`h-10 w-10 rounded-full bg-gradient-to-br ${g} border-2 border-[#12121f]`} />
                ))}
                <button className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-white/5"><RotateCw className="h-4 w-4" /></button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
