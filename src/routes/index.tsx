import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Moon, Sun, Bell, ChevronDown, ArrowDownLeft, ArrowUpRight, Crown,
  Briefcase, Receipt, Route as RouteIcon, Users, FileText, BookOpen,
  Gift, PiggyBank, Heart, Home, Search, Wallet, User,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Root,
  head: () => ({
    meta: [
      { title: "FastCredit — Dashboard" },
      { name: "description", content: "FastCredit: fast and reliable banking, loans, savings and payments." },
    ],
  }),
});

type Screen = "splash" | "onboarding" | "signup" | "dashboard";

function Root() {
  const [screen, setScreen] = useState<Screen>("splash");
  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("onboarding"), 5000);
      return () => clearTimeout(t);
    }
  }, [screen]);
  if (screen === "splash") return <Splash />;
  if (screen === "onboarding") return <Onboarding onContinue={() => setScreen("signup")} />;
  if (screen === "signup") return <Signup onContinue={() => setScreen("dashboard")} />;
  return <Dashboard />;
}

function Splash() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0e6b3f]">
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
        <div className="text-[#0e6b3f] text-3xl font-black">FastCredit</div>
        <p className="mt-1 text-xs font-semibold text-[#0b1e4d]">Licensed & Secured 🛡️</p>
      </div>
      <div className="mt-8 rounded-3xl bg-[#0e6b3f] aspect-square w-full flex items-center justify-center">
        <div className="text-white text-center px-6">
          <p className="text-2xl font-extrabold">Smart Credit</p>
          <p className="mt-2 text-sm opacity-90">Loans • Savings • Pools • Pay in 3</p>
        </div>
      </div>
      <h1 className="mt-6 text-center text-2xl font-extrabold text-[#0b1e4d]">
        Fast and reliable banking<br />at your fingertips
      </h1>
      <div className="mt-auto pt-6 flex flex-col gap-3">
        <button onClick={onContinue} className="w-full rounded-2xl bg-[#0e6b3f] py-4 text-white font-bold">New To FastCredit</button>
        <button onClick={onContinue} className="w-full rounded-2xl border-2 border-[#0e6b3f] py-4 text-[#0e6b3f] font-bold">Login</button>
        <p className="text-center text-sm text-[#0b1e4d]">
          Already have a FastCredit Account?{" "}
          <button onClick={onContinue} className="text-[#0e6b3f] font-semibold">Continue</button>
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

const CATEGORIES = [
  { icon: Briefcase, label: "Wallet" },
  { icon: Receipt, label: "Payments" },
  { icon: RouteIcon, label: "Journey" },
  { icon: Users, label: "Rosca" },
  { icon: FileText, label: "Sanad" },
  { icon: BookOpen, label: "Tabwa" },
  { icon: Gift, label: "Donation" },
  { icon: PiggyBank, label: "Savings" },
];

function Dashboard() {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [openCur, setOpenCur] = useState(false);
  const [dark, setDark] = useState(false);

  const fmtBalance = (usd: number) => {
    const v = usd * currency.rate;
    const parts = v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(".");
    return { int: `${currency.symbol}${parts[0]}`, dec: parts[1] };
  };
  const fmt = (usd: number, decimals = 0) => {
    const v = usd * currency.rate;
    return `${currency.symbol}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const bal = fmtBalance(32680.20);
  const isDark = dark;

  const bg = isDark ? "bg-[#0a1410]" : "bg-[#e8f5ec]";
  const card = isDark ? "bg-[#111f19] text-white" : "bg-white text-[#0b1e1a]";
  const softText = isDark ? "text-white/60" : "text-[#0b1e1a]/60";
  const chipBg = isDark ? "bg-white/10" : "bg-white";

  return (
    <div className={`min-h-screen w-full ${bg} transition-colors`}>
      <div className="mx-auto max-w-[440px] pb-28">
        {/* Green header */}
        <div className="rounded-b-[28px] bg-gradient-to-b from-[#0f7a47] to-[#0a5a34] text-white px-5 pt-10 pb-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute right-10 top-32 h-24 w-24 rounded-full bg-white/5" />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center font-black">F</div>
              <div>
                <p className="text-[11px] opacity-80">Good morning!</p>
                <p className="font-bold leading-tight">Ryan Sterling</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDark(d => !d)} className="h-10 w-10 grid place-items-center rounded-full bg-white/15 backdrop-blur">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button className="h-10 w-10 grid place-items-center rounded-full bg-white/15 backdrop-blur relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </button>
            </div>
          </div>

          <p className="mt-6 text-sm opacity-80">Total Balance</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <div className="flex items-end">
              <span className="text-5xl font-extrabold tracking-tight">{bal.int}</span>
              <span className="text-2xl font-bold opacity-80">.{bal.dec}</span>
            </div>
            <div className="relative">
              <button onClick={() => setOpenCur(o => !o)} className="rounded-full bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                {currency.code} <ChevronDown className="h-3 w-3" />
              </button>
              {openCur && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white text-[#0b1e1a] shadow-xl z-20 overflow-hidden">
                  {CURRENCIES.map(c => (
                    <button key={c.code} onClick={() => { setCurrency(c); setOpenCur(false); }}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-black/5 ${c.code === currency.code ? "font-bold text-emerald-600" : ""}`}>
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/15 py-3 text-sm font-semibold">
              <ArrowDownLeft className="h-4 w-4" /> Request
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white text-[#0e6b3f] py-3 text-sm font-bold shadow-lg">
              <ArrowUpRight className="h-4 w-4" /> Transfer
            </button>
            <button className="flex items-center justify-center gap-1 rounded-full bg-white/10 border border-white/15 py-3 px-3 text-xs font-semibold">
              <Crown className="h-4 w-4" />
            </button>
          </div>
          <button className="mt-2 w-full rounded-full bg-amber-400 text-[#3a2500] py-2.5 text-xs font-bold flex items-center justify-center gap-1.5">
            <Crown className="h-3.5 w-3.5" /> Upgrade to Premium
          </button>
        </div>

        {/* Categories */}
        <section className={`mx-4 mt-4 rounded-3xl ${card} p-5 shadow-sm`}>
          <h2 className="font-bold text-lg">Categories</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <button key={label} className="flex flex-col items-center gap-2">
                <div className={`h-14 w-14 rounded-2xl ${chipBg} ${isDark ? "" : "shadow-[0_4px_12px_rgba(14,107,63,0.08)]"} grid place-items-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[11px] ${softText}`}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Great Deals */}
        <section className="mt-5 pl-4">
          <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-[#0b1e1a]"}`}>Great Deals</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto pr-4 pb-2 [&::-webkit-scrollbar]:hidden">
            {[0, 1].map(i => (
              <article key={i} className={`min-w-[85%] rounded-3xl ${card} p-4 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">Long-term earning</p>
                    <p className={`text-[11px] ${softText}`}>10 months • Investment</p>
                  </div>
                  <div className="flex gap-2">
                    <button className={`h-8 w-8 rounded-full ${isDark ? "bg-white/10" : "bg-[#f2f5f3]"} grid place-items-center`}>
                      <Heart className="h-3.5 w-3.5" />
                    </button>
                    <button className={`h-8 w-8 rounded-full ${isDark ? "bg-white/10" : "bg-[#f2f5f3]"} grid place-items-center`}>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className={softText}>Amount</p>
                    <p className="font-bold text-sm">{fmt(5000)}</p>
                  </div>
                  <div>
                    <p className={softText}>Monthly payment</p>
                    <p className="font-bold text-sm">{fmt(500)}</p>
                  </div>
                  <div>
                    <p className={softText}>Duration</p>
                    <p className="font-bold text-sm">10 Month</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-lime-300 to-lime-500" />
                  <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500" />
                  <div className={`h-2 flex-1 rounded-full ${isDark ? "bg-white/10" : "bg-[#eef1ef]"} overflow-hidden`}>
                    <div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent_0_4px,rgba(0,0,0,0.08)_4px_8px)]" />
                  </div>
                </div>
                <div className={`mt-2 flex items-center justify-between text-[10px] ${softText}`}>
                  <span>Last 4w</span>
                  <span className="flex items-center gap-1">
                    Fees <span className="rounded-full bg-black text-white px-2 py-0.5 text-[10px] font-bold">{fmt(25)}</span>
                  </span>
                  <span>Since Mar 25</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px]">
        <div className="rounded-full bg-[#0e6b3f] text-white flex items-center justify-around px-3 py-3 shadow-2xl">
          <button className="h-11 w-11 grid place-items-center rounded-full bg-white/20">
            <Home className="h-5 w-5" />
          </button>
          <button className="h-11 w-11 grid place-items-center text-white/80"><Heart className="h-5 w-5" /></button>
          <button className="h-11 w-11 grid place-items-center text-white/80"><Search className="h-5 w-5" /></button>
          <button className="h-11 w-11 grid place-items-center text-white/80"><Wallet className="h-5 w-5" /></button>
          <button className="h-11 w-11 grid place-items-center text-white/80"><User className="h-5 w-5" /></button>
        </div>
      </nav>
    </div>
  );
}
