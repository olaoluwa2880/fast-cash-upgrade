import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Moon, Sun, Bell, ChevronDown, ArrowDownLeft, ArrowUpRight, Crown,
  Briefcase, Receipt, Route as RouteIcon, Users, FileText, BookOpen,
  Gift, PiggyBank, Heart, Home, Search, Wallet, User, X, Check,
  Sparkles, Pickaxe, Zap, Pause, Play,
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

type Screen = "splash" | "onboarding" | "signup" | "google" | "processing" | "otp" | "dashboard";

function Root() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("onboarding"), 5000);
      return () => clearTimeout(t);
    }
    if (screen === "processing") {
      const t = setTimeout(() => setScreen("otp"), 5000);
      return () => clearTimeout(t);
    }
  }, [screen]);
  if (screen === "splash") return <Splash />;
  if (screen === "onboarding") return <Onboarding onContinue={() => setScreen("signup")} />;
  if (screen === "signup") return <Signup onGoogle={() => setScreen("google")} onContinue={(email) => { setUserEmail(email); setScreen("processing"); }} />;
  if (screen === "google") return <GoogleAuth onDone={(email) => { setUserEmail(email); setScreen("processing"); }} />;
  if (screen === "processing") return <Processing />;
  if (screen === "otp") return <OtpScreen email={userEmail} onDone={() => setScreen("dashboard")} />;
  return <Dashboard />;
}

function GoogleAuth({ onDone }: { onDone: (email: string) => void }) {
  const [step, setStep] = useState<"email" | "password">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen w-full bg-white flex flex-col px-6 pt-10 pb-8">
      <div className="flex items-center gap-2">
        <svg className="h-8 w-8" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.2 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.5-4.5 2.4-7.1 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.2 5.4l6.2 5.1c-.4.4 6.7-4.9 6.7-14.5 0-1.2-.1-2.4-.3-3.5z"/></svg>
        <span className="text-xl text-[#5f6368]">Google</span>
      </div>

      {step === "email" ? (
        <>
          <h1 className="mt-8 text-2xl text-[#202124]">Sign in</h1>
          <p className="mt-2 text-sm text-[#202124]">Use your Google Account to continue to FastCredit</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
            className="mt-6 w-full rounded-md border border-[#dadce0] px-4 py-3.5 text-sm outline-none focus:border-[#1a73e8]" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email or phone"
            className="mt-3 w-full rounded-md border border-[#dadce0] px-4 py-3.5 text-sm outline-none focus:border-[#1a73e8]" />
          <p className="mt-3 text-[13px] text-[#1a73e8] font-medium">Forgot email?</p>
          <p className="mt-6 text-xs text-[#5f6368]">Not your computer? Use Guest mode to sign in privately.</p>
          <div className="mt-auto flex items-center justify-between pt-8">
            <button className="text-[#1a73e8] text-sm font-medium">Create account</button>
            <button disabled={!name.trim() || !email.trim()} onClick={() => setStep("password")}
              className="rounded-md bg-[#1a73e8] px-6 py-2.5 text-white text-sm font-medium disabled:opacity-50">Next</button>
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-8 text-2xl text-[#202124]">Welcome</h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-3 py-1.5 self-start">
            <div className="h-6 w-6 rounded-full bg-[#1a73e8] text-white grid place-items-center text-xs font-bold">{email[0]?.toUpperCase()}</div>
            <span className="text-sm text-[#202124]">{email}</span>
          </div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
            className="mt-6 w-full rounded-md border border-[#dadce0] px-4 py-3.5 text-sm outline-none focus:border-[#1a73e8]" />
          <label className="mt-4 flex items-center gap-2 text-sm text-[#202124]">
            <input type="checkbox" /> Show password
          </label>
          <div className="mt-auto flex items-center justify-between pt-8">
            <button className="text-[#1a73e8] text-sm font-medium">Forgot password?</button>
            <button disabled={!password} onClick={() => onDone(email)}
              className="rounded-md bg-[#1a73e8] px-6 py-2.5 text-white text-sm font-medium disabled:opacity-50">Next</button>
          </div>
        </>
      )}
    </div>
  );
}

function Processing() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        <div className="h-14 w-14 rounded-full border-4 border-[#0e6b3f]/20 border-t-[#0e6b3f] animate-spin" />
        <p className="text-[#0b1e1a] font-semibold">Verifying your account…</p>
        <p className="text-xs text-[#0b1e1a]/60">Sending SMS code to your email</p>
      </div>
    </div>
  );
}

function OtpScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const [seconds, setSeconds] = useState(24);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const filled = code.every(c => c);
  return (
    <div className="min-h-screen w-full bg-white flex flex-col px-6 pt-14 pb-8">
      <h1 className="text-2xl font-extrabold text-[#0b1e4d]">Verify SMS Code</h1>
      <p className="mt-2 text-sm text-[#0b1e4d]/70">
        We sent a 6-digit SMS code to <span className="font-semibold">{email || "your email"}</span>. Enter it below to create your FastCredit account.
      </p>

      <div className="mt-8 flex justify-between gap-2">
        {code.map((c, i) => (
          <input key={i} value={c} maxLength={1} inputMode="numeric"
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "");
              const next = [...code]; next[i] = v; setCode(next);
              if (v && i < 5) (document.getElementById(`otp-${i+1}`) as HTMLInputElement)?.focus();
            }}
            id={`otp-${i}`}
            className="h-14 w-12 text-center text-xl font-bold rounded-xl border-2 border-[#0e6b3f]/20 focus:border-[#0e6b3f] outline-none" />
        ))}
      </div>

      <div className="mt-6 text-center">
        {seconds > 0 ? (
          <p className="text-sm text-[#0b1e4d]/70">
            Code expires in <span className="font-bold text-[#0e6b3f]">{seconds}s</span>
          </p>
        ) : (
          <button onClick={() => setSeconds(24)} className="text-sm font-semibold text-[#0e6b3f]">Resend code</button>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-[#eefaf2] border border-[#0e6b3f]/15 p-4">
        <p className="text-xs font-bold text-[#0e6b3f]">📧 Check your email inbox</p>
        <p className="mt-1 text-xs text-[#0b1e1a]/70">
          The SMS verification code has been sent to your Gmail. Open your inbox to find it.
        </p>
      </div>

      <button onClick={onDone} disabled={!filled || seconds <= 0}
        className="mt-auto w-full rounded-2xl bg-[#0e6b3f] py-4 text-white font-bold disabled:opacity-50">
        Verify & Create Account
      </button>
    </div>
  );
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
          <p className="mt-2 text-sm opacity-90">FastCredit • Savings • Pools • Pay in 3</p>
        </div>
      </div>
      <h1 className="mt-6 text-center text-2xl font-extrabold text-[#0b1e4d]">
        Using fasting trading app
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

function Signup({ onContinue, onGoogle }: { onContinue: (email: string) => void; onGoogle: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const canSubmit = fullName.trim() && email.trim() && phone.trim() && password.length >= 6;
  return (
    <div className="min-h-screen w-full bg-black flex flex-col px-6 pt-14 pb-8 text-white">
      <div className="flex flex-col items-center">
        <div className="text-white text-3xl font-black">FastCredit</div>
        <p className="mt-1 text-xs font-semibold text-white/70">Create your account</p>
      </div>

      <button
        onClick={onGoogle}
        className="mt-8 w-full rounded-2xl bg-white text-black py-4 font-bold flex items-center justify-center gap-3 shadow-lg"
      >
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 43.5c5.2 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.5-4.5 2.4-7.1 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.2 5.4l6.2 5.1c-.4.4 6.7-4.9 6.7-14.5 0-1.2-.1-2.4-.3-3.5z"/>
        </svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-white/40 text-xs">
        <div className="flex-1 h-px bg-white/15" />
        <span>or fill in your details</span>
        <div className="flex-1 h-px bg-white/15" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/60">Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ryan Sterling"
            className="mt-1 w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
        </div>
        <div>
          <label className="text-xs text-white/60">Gmail Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com"
            className="mt-1 w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
        </div>
        <div>
          <label className="text-xs text-white/60">Phone Number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000"
            className="mt-1 w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
        </div>
        <div>
          <label className="text-xs text-white/60">Password</label>
          <div className="mt-1 relative">
            <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 pr-16 text-sm outline-none focus:border-emerald-400" />
            <button type="button" onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-300 font-semibold">
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      </div>

      <button onClick={() => onContinue(email)} disabled={!canSubmit}
        className="mt-6 w-full rounded-2xl bg-[#0e6b3f] py-4 font-bold disabled:opacity-50">
        Create Account
      </button>
      <p className="mt-4 text-center text-xs text-white/60">
        By continuing you agree to FastCredit's Terms & Privacy Policy.
      </p>
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

// Realistic returns: ~1.5% every 48h (7 payouts) → ~10.5% total over 14 days
const PREMIUM_PLANS = [
  { invest: 10, profit: 0.15, total: 1.05, returned: 11.05 },
  { invest: 25, profit: 0.38, total: 2.63, returned: 27.63 },
  { invest: 50, profit: 0.75, total: 5.25, returned: 55.25 },
  { invest: 100, profit: 1.50, total: 10.50, returned: 110.50 },
  { invest: 250, profit: 3.75, total: 26.25, returned: 276.25 },
  { invest: 500, profit: 7.50, total: 52.50, returned: 552.50 },
  { invest: 1000, profit: 15, total: 105, returned: 1105 },
  { invest: 1500, profit: 22.50, total: 157.50, returned: 1657.50 },
  { invest: 2000, profit: 30, total: 210, returned: 2210 },
  { invest: 2500, profit: 37.50, total: 262.50, returned: 2762.50 },
  { invest: 3000, profit: 45, total: 315, returned: 3315 },
  { invest: 3500, profit: 52.50, total: 367.50, returned: 3867.50 },
];

const DAY = 24 * 60 * 60 * 1000;
const MINE_COOLDOWN = 48 * 60 * 60 * 1000;
const PLAN_DURATION = 14 * DAY;

function Dashboard() {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [openCur, setOpenCur] = useState(false);
  const [dark, setDark] = useState(false);
  const [openPremium, setOpenPremium] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [balanceUsd, setBalanceUsd] = useState(0);
  const [activePlan, setActivePlan] = useState<{ index: number; startedAt: number } | null>(null);
  const [lastMineAt, setLastMineAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const planExpiresAt = activePlan ? activePlan.startedAt + PLAN_DURATION : 0;
  const planActive = activePlan !== null && now < planExpiresAt;
  const nextMineAt = lastMineAt ? lastMineAt + MINE_COOLDOWN : 0;
  const mineReady = planActive && (lastMineAt === null || now >= nextMineAt);
  const currentPlan = activePlan ? PREMIUM_PLANS[activePlan.index] : null;

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const claimBonus = () => {
    if (bonusClaimed) return;
    setBalanceUsd(b => b + 2);
    setBonusClaimed(true);
  };

  const mine = () => {
    if (!mineReady || !currentPlan) return;
    setBalanceUsd(b => b + currentPlan.profit);
    setLastMineAt(Date.now());
  };

  const activatePlan = () => {
    setActivePlan({ index: selectedPlan, startedAt: Date.now() });
    setLastMineAt(null);
    setOpenPremium(false);
  };

  const fmtBalance = (usd: number) => {
    const v = usd * currency.rate;
    const parts = v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(".");
    return { int: `${currency.symbol}${parts[0]}`, dec: parts[1] };
  };
  const fmt = (usd: number, decimals = 0) => {
    const v = usd * currency.rate;
    return `${currency.symbol}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const bal = fmtBalance(balanceUsd);
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
          <button onClick={() => setOpenPremium(true)} className="mt-2 w-full rounded-full bg-amber-400 text-[#3a2500] py-2.5 text-xs font-bold flex items-center justify-center gap-1.5">
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

        {/* Welcome Bonus */}
        <section className="mx-4 mt-4">
          <div className={`rounded-3xl p-4 flex items-center gap-3 shadow-sm ${isDark ? "bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 border border-emerald-500/20" : "bg-gradient-to-r from-emerald-50 to-lime-50 border border-emerald-200"}`}>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 grid place-items-center text-white shadow-lg shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${softText}`}>Welcome bonus</p>
              <p className={`font-extrabold text-lg leading-tight ${isDark ? "text-white" : "text-[#0b1e1a]"}`}>{fmt(2, 2)} <span className="text-[11px] font-medium opacity-70">≈ $2 USD</span></p>
            </div>
            <button
              onClick={claimBonus}
              disabled={bonusClaimed}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${bonusClaimed ? "bg-emerald-600/20 text-emerald-500" : "bg-emerald-500 text-white shadow-md active:scale-95"}`}
            >
              {bonusClaimed ? "Claimed" : "Claim"}
            </button>
          </div>
        </section>

        {/* Mining */}
        <section className="mx-4 mt-4">
          <div className={`rounded-3xl overflow-hidden shadow-sm ${card}`}>
            <div className="p-5 bg-gradient-to-br from-[#0e6b3f] to-[#0a4a2c] text-white relative">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center">
                    <Pickaxe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold leading-tight">Premium Mining</p>
                    <p className="text-[11px] opacity-80 flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${planActive ? "bg-emerald-300 animate-pulse" : "bg-white/40"}`} />
                      {planActive ? `Plan active · ${formatCountdown(planExpiresAt - now)} left` : "No active plan"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-70 uppercase">Reward</p>
                  <p className="text-sm font-bold flex items-center gap-1 justify-end">
                    <Zap className="h-3 w-3" /> {currentPlan ? fmt(currentPlan.profit, 2) : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] opacity-80 relative">Next mine reward</p>
              <p className="mt-0.5 text-3xl font-extrabold tracking-tight relative">
                {currentPlan ? fmt(currentPlan.profit, 2) : fmt(0, 2)}
              </p>
              <p className="text-[10px] opacity-70 relative">
                {planActive
                  ? mineReady
                    ? "Ready to mine now"
                    : `Next mine in ${formatCountdown(nextMineAt - now)}`
                  : "Activate a Premium plan to start mining"}
              </p>
            </div>
            <div className="p-4">
              <button
                onClick={planActive ? mine : () => setOpenPremium(true)}
                disabled={planActive && !mineReady}
                className={`w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold shadow-md ${
                  !planActive
                    ? "bg-amber-500 text-[#3a2500]"
                    : mineReady
                    ? "bg-emerald-500 text-white active:scale-95"
                    : "bg-black/10 text-[#0b1e1a]/50"
                }`}
              >
                {!planActive ? (
                  <><Crown className="h-4 w-4" /> Activate Premium to Mine</>
                ) : mineReady ? (
                  <><Pickaxe className="h-4 w-4" /> Mine {currentPlan ? fmt(currentPlan.profit, 2) : ""}</>
                ) : (
                  <><Pause className="h-4 w-4" /> Cooldown {formatCountdown(nextMineAt - now)}</>
                )}
              </button>
              <p className={`mt-2 text-center text-[10px] ${softText}`}>
                Mine once every 48 hours · Higher plan = higher reward
              </p>
            </div>
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

      {openPremium && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpenPremium(false)}>
          <div onClick={e => e.stopPropagation()} className={`w-full max-w-[440px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl ${isDark ? "bg-[#111f19] text-white" : "bg-white text-[#0b1e1a]"} shadow-2xl`}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-black/5 bg-gradient-to-r from-amber-400 to-amber-500 text-[#3a2500] rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                <div>
                  <p className="font-black text-base leading-tight">Premium Upgrade</p>
                  <p className="text-[10px] font-semibold opacity-80">14 days · Payouts every 48h</p>
                </div>
              </div>
              <button onClick={() => setOpenPremium(false)} className="h-8 w-8 grid place-items-center rounded-full bg-black/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-amber-50"} border ${isDark ? "border-white/10" : "border-amber-200"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${softText}`}>Starting investment</p>
                <p className="mt-1 text-3xl font-extrabold text-amber-600">{fmt(10, currency.code === "USD" || currency.code === "EUR" || currency.code === "GBP" ? 2 : 0)}</p>
                <p className={`mt-1 text-[11px] ${softText}`}>≈ $10 USD · Shown in {currency.code}</p>
              </div>

              <p className={`mt-5 text-xs font-bold uppercase tracking-wide ${softText}`}>Choose a plan</p>
              <div className="mt-3 space-y-2">
                {PREMIUM_PLANS.map((p, i) => {
                  const dec = ["USD", "EUR", "GBP"].includes(currency.code) ? 2 : 0;
                  const active = selectedPlan === i;
                  return (
                    <button
                      key={p.invest}
                      onClick={() => setSelectedPlan(i)}
                      className={`w-full text-left rounded-2xl p-4 border transition ${active ? "border-amber-500 bg-amber-50 text-[#0b1e1a] shadow-md" : isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full grid place-items-center ${active ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700"}`}>
                            {active ? <Check className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-extrabold">{fmt(p.invest, dec)}</p>
                            <p className={`text-[10px] ${active ? "text-[#0b1e1a]/60" : softText}`}>Investment</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-emerald-600">{fmt(p.returned, dec)}</p>
                          <p className={`text-[10px] ${active ? "text-[#0b1e1a]/60" : softText}`}>at expiry</p>
                        </div>
                      </div>
                      <div className={`mt-3 grid grid-cols-2 gap-2 text-[11px] ${active ? "text-[#0b1e1a]/80" : softText}`}>
                        <div className={`rounded-lg px-2 py-1.5 ${active ? "bg-white" : isDark ? "bg-white/5" : "bg-[#f6f8f7]"}`}>
                          <p className="opacity-70">Every 48h</p>
                          <p className={`font-bold ${active ? "text-[#0b1e1a]" : ""}`}>{fmt(p.profit, 2)}</p>
                        </div>
                        <div className={`rounded-lg px-2 py-1.5 ${active ? "bg-white" : isDark ? "bg-white/5" : "bg-[#f6f8f7]"}`}>
                          <p className="opacity-70">Total 14d</p>
                          <p className={`font-bold ${active ? "text-[#0b1e1a]" : ""}`}>{fmt(p.total, 2)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className={`mt-4 rounded-2xl p-3 text-[11px] ${isDark ? "bg-white/5 text-white/70" : "bg-[#f6f8f7] text-[#0b1e1a]/70"}`}>
                <p className="font-bold mb-1">How it works</p>
                <ul className="space-y-0.5 list-disc pl-4">
                  <li>Profits credited every 48 hours (7 payouts).</li>
                  <li>Each plan runs for 14 days, then expires automatically.</li>
                  <li>Purchase a new plan after the current one ends.</li>
                </ul>
              </div>

              <button className="mt-4 w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[#3a2500] py-3.5 font-black text-sm shadow-lg flex items-center justify-center gap-2">
                <Crown className="h-4 w-4" /> Activate for {fmt(PREMIUM_PLANS[selectedPlan].invest, ["USD","EUR","GBP"].includes(currency.code) ? 2 : 0)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
