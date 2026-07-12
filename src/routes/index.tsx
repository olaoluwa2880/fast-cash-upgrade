import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Wallet, Users, BarChart2, CreditCard, FileText,
  Bot, Shield, FileBarChart, ShieldAlert, ChevronDown, ChevronRight,
  Search, Calendar, Inbox, Download, Star, ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Root,
  head: () => ({
    meta: [
      { title: "FastCredit — Dashboard" },
      { name: "description", content: "FastCredit dashboard: sales overview, balances and analytics." },
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

function Sparkline({ color = "#22c55e", highlight }: { color?: string; highlight?: string }) {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-14">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,40 C20,35 30,20 50,25 C70,30 85,45 105,35 C125,25 140,15 165,28 C180,35 190,20 200,25 L200,60 L0,60 Z" fill={`url(#sg-${color})`} />
      <path d="M0,40 C20,35 30,20 50,25 C70,30 85,45 105,35 C125,25 140,15 165,28 C180,35 190,20 200,25" stroke={color} strokeWidth="1.5" fill="none" />
      {highlight && (
        <>
          <circle cx="105" cy="35" r="4" fill={color} stroke="#0b1220" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

function Dashboard() {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [openCur, setOpenCur] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);

  const fmt = (usd: number, decimals = 2) => {
    const v = usd * currency.rate;
    return `${currency.symbol}${v.toLocaleString(undefined, {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    })}`;
  };

  const navMain = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Wallet, label: "Balances" },
    { icon: Users, label: "Customers" },
    { icon: BarChart2, label: "Analytics" },
    { icon: CreditCard, label: "Payments" },
    { icon: FileText, label: "Invoices" },
  ];
  const aiSub = [
    { icon: Shield, label: "Security Center" },
    { icon: FileBarChart, label: "AI Reports" },
    { icon: ShieldAlert, label: "Fraud Detection" },
  ];

  const salesCards = [
    { label: "Today's sales", value: 230, count: 7, date: "Nov 02, 25", color: "#38bdf8", highlight: false },
    { label: "This week's", value: 820, count: 34, date: "Oct 27 - Nov 02, 25", color: "#22c55e", highlight: true },
    { label: "This month's", value: 1420, count: 74, date: "Oct. 25", color: "#818cf8", highlight: false },
    { label: "Last month's", value: 3410, count: 121, date: "Sep. 25", color: "#22c55e", highlight: false },
  ];

  return (
    <div className="min-h-screen bg-[#e9ecef] p-2 md:p-3">
      <div className="flex gap-0 rounded-2xl overflow-hidden bg-white min-h-[calc(100vh-1rem)]">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col bg-white text-[#0b1220] py-5 px-3 border-r border-black/5">
          <div className="flex items-center gap-2 px-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 grid place-items-center text-white font-black">F</div>
            <span className="font-black text-lg">FastCredit</span>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {navMain.map(({ icon: Icon, label, active }) => (
              <button key={label} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active ? "bg-[#eef2f7] font-semibold" : "text-[#4b5563] hover:bg-black/5"}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
            <button onClick={() => setAiOpen(o => !o)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#4b5563] hover:bg-black/5 justify-between">
              <span className="flex items-center gap-3"><Bot className="h-4 w-4" /> AI Tools</span>
              <ChevronDown className={`h-4 w-4 transition ${aiOpen ? "" : "-rotate-90"}`} />
            </button>
            {aiOpen && (
              <div className="ml-6 flex flex-col gap-1 border-l border-black/10 pl-3">
                {aiSub.map(({ label }) => (
                  <button key={label} className="text-left text-xs text-[#4b5563] py-1.5 hover:text-black">{label}</button>
                ))}
              </div>
            )}
          </nav>
          <button className="mt-auto flex items-center gap-2 px-3 py-2 text-xs text-[#6b7280]">
            <ChevronLeft className="h-3.5 w-3.5" /> Hide panel
          </button>
        </aside>

        {/* Main dark panel */}
        <main className="flex-1 bg-[#0b1220] text-white p-4 md:p-8 rounded-l-2xl">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-white/50">Today: November 02, 2025</p>
              <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Dashboard</h1>
            </div>
            <div className="flex-1 max-w-md min-w-[220px] relative">
              <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input placeholder="Search" className="w-full bg-[#131b2e] border border-white/10 rounded-full pl-10 pr-20 py-3 text-sm placeholder:text-white/40 focus:outline-none" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-white/10 px-2 py-1 rounded-full">⌘ + Space</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setOpenCur(o => !o)} className="rounded-full bg-[#131b2e] border border-white/10 px-3 py-2 text-xs font-semibold flex items-center gap-1">
                  {currency.code} <ChevronDown className="h-3 w-3" />
                </button>
                {openCur && (
                  <div className="absolute right-0 mt-2 w-32 rounded-xl bg-[#131b2e] border border-white/10 shadow-xl z-20 overflow-hidden">
                    {CURRENCIES.map(c => (
                      <button key={c.code} onClick={() => { setCurrency(c); setOpenCur(false); }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 ${c.code === currency.code ? "font-bold text-emerald-400" : ""}`}>
                        {c.symbol} {c.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 bg-[#131b2e] border border-white/10 rounded-full pl-1 pr-3 py-1">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-300 to-orange-300" />
                <div className="text-xs leading-tight">
                  <p className="font-semibold">Jamie Brown</p>
                  <p className="text-white/50 text-[10px]">@jamie_brown</p>
                </div>
                <ChevronDown className="h-3 w-3 text-white/50" />
              </div>
            </div>
          </div>

          {/* Sales overview */}
          <h2 className="mt-8 text-lg font-semibold">Sales overview</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {salesCards.map((c) => (
              <div key={c.label} className="rounded-2xl bg-[#131b2e] border border-white/5 p-4">
                <p className="text-xs text-white/50">{c.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{fmt(c.value, 2)}</p>
                <div className="relative mt-2">
                  {c.highlight && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] bg-[#0b1220] border border-white/10 px-1.5 py-0.5 rounded">
                      {currency.symbol}14
                    </span>
                  )}
                  <Sparkline color={c.color} highlight={c.highlight ? "y" : undefined} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60 pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.date}</span>
                  <span className="flex items-center gap-1"><Inbox className="h-3 w-3" /> {c.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sales */}
          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sales</h2>
            <button className="rounded-full bg-[#131b2e] border border-white/10 px-3 py-1.5 text-xs flex items-center gap-1.5">
              <Download className="h-3 w-3" /> Download report
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Chart */}
            <div className="lg:col-span-2 rounded-2xl bg-[#131b2e] border border-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">Sales over 7 days in {currency.symbol} ({currency.code})</p>
                <div className="flex gap-1 text-[10px]">
                  <button className="bg-white/10 rounded-full px-2 py-1">7 d</button>
                  <button className="text-white/60 rounded-full px-2 py-1">30 d</button>
                </div>
              </div>
              <div className="mt-4 flex gap-3 text-[10px] text-white/40">
                <div className="flex flex-col justify-between h-52 py-2">
                  <span>5,000</span><span>4,000</span><span>3,000</span><span>2,000</span><span>1,000</span>
                </div>
                <div className="flex-1">
                  <svg viewBox="0 0 500 200" className="w-full h-52">
                    <defs>
                      <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,90 L30,85 L60,60 L70,120 L80,55 L110,75 L140,70 L170,80 L200,65 L230,70 L260,55 L280,140 L310,45 L340,50 L370,55 L400,50 L430,45 L460,40 L500,35 L500,200 L0,200 Z" fill="url(#area)" />
                    <path d="M0,90 L30,85 L60,60 L70,120 L80,55 L110,75 L140,70 L170,80 L200,65 L230,70 L260,55 L280,140 L310,45 L340,50 L370,55 L400,50 L430,45 L460,40 L500,35" stroke="#22c55e" strokeWidth="1.5" fill="none" />
                    <circle cx="80" cy="55" r="5" fill="#22c55e" stroke="#0b1220" strokeWidth="2" />
                  </svg>
                  <div className="flex justify-between text-[10px] text-white/40 mt-1">
                    <span>27 Oct</span><span>28 Oct</span><span>29 Oct</span><span>30 Oct</span><span>31 Oct</span>
                  </div>
                </div>
              </div>
              <div className="mt-[-190px] ml-16 inline-block relative">
                <span className="text-[10px] bg-[#131b2e] border border-white/10 px-2 py-1 rounded">{currency.symbol} {(3200 * currency.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl bg-[#131b2e] border border-white/5 p-5 relative overflow-hidden">
                <div className="h-9 w-9 rounded-full bg-white/10 grid place-items-center">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-emerald-500/20 grid place-items-center font-black text-emerald-400">F</div>
                <h3 className="mt-4 text-2xl font-extrabold">Upgrade to Premium</h3>
                <p className="mt-1 text-xs text-white/60">Get advanced analytics and priority support.</p>
                <button className="mt-4 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold">Upgrade now</button>
              </div>
              <div className="rounded-2xl bg-[#131b2e] border border-white/5 p-5">
                <p className="text-sm">See how the analytics changed<br />in the previous week?</p>
                <button className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1">Go to analytics <ChevronRight className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
