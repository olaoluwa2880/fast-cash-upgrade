import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Moon, Sun, Bell, ChevronDown, ArrowDownLeft, ArrowUpRight, Crown,
  Briefcase, Receipt, Route as RouteIcon, Users,
  Gift, PiggyBank, Heart, Home, Search, Wallet, User, X, Check,
  Sparkles, Pickaxe, Zap, Pause, Copy, Upload, LifeBuoy, Clock,
  Award, UserCircle, Download, TrendingUp, XCircle, Mail, Calendar,
  Globe, Smartphone, CreditCard, MessageCircle, Send, Phone, ExternalLink,
  LogOut, RefreshCw, Coins, UserPlus, ArrowLeftRight, Settings as SettingsIcon,
  ArrowRight, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, supportHref } from "@/lib/site-settings";
import { usePush } from "@/components/PushNotifications";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { COUNTRIES, BANKS_BY_COUNTRY, type Bank } from "@/lib/banks-data";
import { getBanksForCountry } from "@/lib/banks.functions";


export const Route = createFileRoute("/_authenticated/")({
  component: Root,
  head: () => ({
    meta: [
      { title: "FastCredit — Dashboard" },
      { name: "description", content: "FastCredit: fast and reliable banking, loans, savings and payments." },
    ],
  }),
});

type Screen = "splash" | "dashboard";

type UserProfile = {
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  avatar_url: string;
  referral_code: string;
  created_at: string;
  currency: string;
};

const DEFAULT_PROFILE: UserProfile = {
  name: "", username: "", email: "", phone: "", country: "Nigeria",
  avatar_url: "", referral_code: "", created_at: "", currency: "USD",
};

function Root() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("dashboard"), 2000);
      return () => clearTimeout(t);
    }
  }, [screen]);
  // Load registered profile details from the database
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, username, email, phone, country, avatar_url, referral_code, created_at, currency")
        .eq("id", u.user.id)
        .maybeSingle();
      if (cancelled) return;
      const meta = (u.user.user_metadata ?? {}) as Record<string, string | undefined>;
      setUserProfile({
        name: p?.full_name ?? meta.full_name ?? meta.name ?? "",
        username: p?.username ?? (u.user.email ? u.user.email.split("@")[0] : ""),
        email: p?.email ?? u.user.email ?? "",
        phone: p?.phone ?? meta.phone ?? "",
        country: p?.country ?? meta.country ?? "Nigeria",
        avatar_url: p?.avatar_url ?? "",
        referral_code: p?.referral_code ?? "",
        created_at: p?.created_at ?? u.user.created_at ?? "",
        currency: p?.currency ?? "USD",
      });
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);
  // Realtime enforcement: kick the user out if an admin bans them mid-session.
  useEffect(() => {
    let cancelled = false;
    async function kickIfBanned() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      const { data: ban } = await supabase
        .from("user_bans").select("user_id").eq("user_id", u.user.id).maybeSingle();
      if (ban && !cancelled) {
        await supabase.auth.signOut();
        window.location.replace("/auth?suspended=1");
      }
    }
    kickIfBanned();
    const channel = supabase
      .channel("ban-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_bans" }, kickIfBanned)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);
  if (screen === "splash") return <Splash />;
  return <Dashboard userProfile={userProfile} />;
}


function Splash() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0D0D0D]">
      <div className="flex flex-col items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#F4CF5B] via-[#D4AF37] to-[#8a6b1e] grid place-items-center shadow-[0_0_40px_rgba(212,175,55,0.4)]">
          <Crown className="h-8 w-8 text-[#0D0D0D]" />
        </div>
        <div className="text-white text-3xl font-black tracking-tight">FastCredit</div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-bounce" />
        </div>
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

const CATEGORIES: { icon: typeof Users; label: string; key: string }[] = [
  { icon: Briefcase, label: "Wallet", key: "wallet" },
  { icon: Receipt, label: "Payments", key: "payments" },
  { icon: RouteIcon, label: "Journey", key: "journey" },
  { icon: Users, label: "Community", key: "community" },
  { icon: LifeBuoy, label: "Support", key: "support" },
  { icon: Clock, label: "History", key: "history" },
  { icon: Gift, label: "Donation", key: "donation" },
  { icon: PiggyBank, label: "Savings", key: "savings" },
];

// Premium plan tiers. mineReward = USD credited per mining tap (2 taps / day, 7 days).
// Deposits are strictly monotonic so each higher plan requires a larger investment.
const PREMIUM_PLANS = (() => {
  const base = [
    { name: "Plan 1", invest: 10,    mineReward: 3 },
    { name: "Plan 2", invest: 20,    mineReward: 5 },
    { name: "Plan 3", invest: 30,    mineReward: 8 },
    { name: "Plan 4", invest: 100,   mineReward: 10 },
    { name: "Plan 5", invest: 310,   mineReward: 25 },
    { name: "Plan 6", invest: 650,   mineReward: 120 },
    { name: "Plan 7", invest: 1500,  mineReward: 210 },
    { name: "Plan 8", invest: 2000,  mineReward: 350 },
    { name: "Plan 9", invest: 2200,  mineReward: 500 },
  ];
  // 2 taps/day × 7 days = 14 total taps
  return base.map(p => {
    const total = p.mineReward * 14;
    return { ...p, profit: p.mineReward * 2, total, returned: p.invest + total };
  });
})();

const PAYMENT_METHODS = [
  { id: "crypto", label: "Pay with Crypto", desc: "BTC, USDT, ETH — instant confirm", emoji: "₿" },
  { id: "ngn", label: "Pay with NGN", desc: "Bank transfer · Naira", emoji: "🇳🇬" },
  { id: "card", label: "Add your Card", desc: "Visa, Mastercard, Verve", emoji: "💳" },
];

// Country + bank data is centralised in `@/lib/banks-data` and can be
// hot-swapped with live provider data via `getBanksForCountry`.
const COUNTRY_BY_CODE: Record<string, (typeof COUNTRIES)[number]> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);
const COUNTRY_BY_CURRENCY: Record<string, (typeof COUNTRIES)[number]> = COUNTRIES.reduce((acc, c) => {
  if (!acc[c.currency]) acc[c.currency] = c;
  return acc;
}, {} as Record<string, (typeof COUNTRIES)[number]>);


const CRYPTOCURRENCIES: { symbol: string; name: string; network: string; emoji: string }[] = [
  { symbol: "BTC", name: "Bitcoin", network: "Bitcoin", emoji: "₿" },
  { symbol: "ETH", name: "Ethereum", network: "ERC20", emoji: "Ξ" },
  { symbol: "BNB", name: "Binance Coin", network: "BEP20", emoji: "🅱" },
  { symbol: "USDT", name: "Tether", network: "TRC20", emoji: "₮" },
  { symbol: "USDC", name: "USD Coin", network: "ERC20", emoji: "🪙" },
  { symbol: "SOL", name: "Solana", network: "Solana", emoji: "◎" },
  { symbol: "XRP", name: "XRP", network: "XRP Ledger", emoji: "✕" },
  { symbol: "ADA", name: "Cardano", network: "Cardano", emoji: "₳" },
  { symbol: "DOGE", name: "Dogecoin", network: "Dogecoin", emoji: "Ð" },
  { symbol: "AVAX", name: "Avalanche", network: "C-Chain", emoji: "🔺" },
  { symbol: "DOT", name: "Polkadot", network: "Polkadot", emoji: "●" },
  { symbol: "LTC", name: "Litecoin", network: "Litecoin", emoji: "Ł" },
  { symbol: "TRX", name: "TRON", network: "TRC20", emoji: "🅃" },
  { symbol: "BCH", name: "Bitcoin Cash", network: "BCH", emoji: "฿" },
  { symbol: "ETC", name: "Ethereum Classic", network: "ETC", emoji: "Ξ" },
  { symbol: "MATIC", name: "Polygon", network: "Polygon", emoji: "◆" },
  { symbol: "LINK", name: "Chainlink", network: "ERC20", emoji: "🔗" },
  { symbol: "XLM", name: "Stellar", network: "Stellar", emoji: "✦" },
  { symbol: "ATOM", name: "Cosmos", network: "Cosmos", emoji: "⚛" },
  { symbol: "XMR", name: "Monero", network: "Monero", emoji: "ɱ" },
  { symbol: "NEAR", name: "NEAR Protocol", network: "NEAR", emoji: "🌐" },
  { symbol: "APT", name: "Aptos", network: "Aptos", emoji: "🅰" },
  { symbol: "ARB", name: "Arbitrum", network: "Arbitrum", emoji: "🔵" },
  { symbol: "OP", name: "Optimism", network: "Optimism", emoji: "🔴" },
  { symbol: "SHIB", name: "Shiba Inu", network: "ERC20", emoji: "🐕" },
];

const DAY = 24 * 60 * 60 * 1000;
const MAX_DAILY_MINES = 2;
const PLAN_DURATION = 7 * DAY;
const MIN_WITHDRAW_USD = 50;

type Txn = {
  id: string;
  kind: "deposit" | "withdraw" | "declined" | "bonus" | "mining";
  amountUsd: number;
  method?: string;
  status: "approved" | "declined" | "credited" | "pending";

  at: number;
  note?: string;
};

function Dashboard({ userProfile }: { userProfile: UserProfile }) {
  const navigate = useNavigate();
  const userEmail = userProfile.email;
  const settings = useSiteSettings();
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  // Restore preferred currency from the saved profile whenever it changes.
  useEffect(() => {
    const saved = CURRENCIES.find(c => c.code === userProfile.currency);
    if (saved) setCurrency(saved);
  }, [userProfile.currency]);
  const changeCurrency = async (c: typeof CURRENCIES[number]) => {
    setCurrency(c);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) await supabase.from("profiles").update({ currency: c.code }).eq("id", u.user.id);
  };
  const [openCur, setOpenCur] = useState(false);
  const [dark, setDark] = useState(false);
  const [openPremium, setOpenPremium] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [balanceUsd, setBalanceUsd] = useState(0);
  const [activePlan, setActivePlan] = useState<{ index: number; startedAt: number } | null>(null);
  const [recentMines, setRecentMines] = useState<number[]>([]); // timestamps of claims in last 24h
  const [now, setNow] = useState(Date.now());
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<"choose" | "instructions" | "processing" | "success" | "pending" | "comingSoon">("choose");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const { push } = usePush();
  const showToast = (msg: string, kind: "info" | "success" | "error" | "wallet" | "reward" | "bonus" = "info") => {
    push({ title: msg, kind });
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("You have been logged out successfully.");
    navigate({ to: "/auth" });
  };
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [wdStep, setWdStep] = useState<"method" | "country" | "bank" | "details" | "crypto" | "cryptoDetails" | "review" | "processing" | "success">("method");
  const [wdMethod, setWdMethod] = useState<"bank" | "crypto" | null>(null);
  const [wdCountry, setWdCountry] = useState<string>("NG");
  const [wdCountrySearch, setWdCountrySearch] = useState("");
  const [wdBankSearch, setWdBankSearch] = useState("");
  const [wdBanksList, setWdBanksList] = useState<Bank[]>([]);
  const [wdBanksLoading, setWdBanksLoading] = useState(false);
  const [wdBanksSource, setWdBanksSource] = useState<"flutterwave" | "static" | null>(null);
  const [wdBank, setWdBank] = useState<string>("");
  const [wdAccountNumber, setWdAccountNumber] = useState("");
  const [wdAccountName, setWdAccountName] = useState("");
  const [wdAmount, setWdAmount] = useState("");
  const [wdCrypto, setWdCrypto] = useState<typeof CRYPTOCURRENCIES[number] | null>(null);
  const [wdCryptoSearch, setWdCryptoSearch] = useState("");
  const [wdWalletAddress, setWdWalletAddress] = useState("");
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [congrats, setCongrats] = useState<null | { title: string; body: string }>(null);

  // Load bank list for the selected country when the bank step is open. Server
  // function tries a live provider first; on any error we fall back to the
  // bundled dataset so the UI is never empty.
  const fetchBanks = useServerFn(getBanksForCountry);
  const loadBanks = async (country: string, { silent = false } = {}) => {
    if (!silent) setWdBanksLoading(true);
    setWdBankSearch("");
    try {
      const res = await fetchBanks({ data: { country } });
      setWdBanksList(res.banks);
      setWdBanksSource(res.source);
    } catch {
      setWdBanksList(BANKS_BY_COUNTRY[country] ?? []);
      setWdBanksSource("static");
    } finally {
      if (!silent) setWdBanksLoading(false);
    }
  };
  useEffect(() => {
    if (!openWithdraw || wdMethod !== "bank" || wdStep !== "bank") return;
    loadBanks(wdCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openWithdraw, wdMethod, wdStep, wdCountry]);


  const addTxn = (t: Omit<Txn, "id" | "at">) =>
    setTransactions(prev => [{ ...t, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now() }, ...prev]);

  // Load wallet balance + payments from DB; subscribe to realtime updates.
  // Uses onAuthStateChange to guarantee the session is fully restored before
  // querying — otherwise a race would make wallet_balances read return nothing
  // and the UI would flash $0.00 after login.
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let loadedUid: string | null = null;

    async function loadUserState(uid: string) {
      const [{ data: bal }, { data: prof }] = await Promise.all([
        supabase.from("wallet_balances").select("balance_usd").eq("user_id", uid).maybeSingle(),
        supabase.from("profiles").select("welcome_bonus_claimed_at").eq("id", uid).maybeSingle(),
      ]);
      // IMPORTANT: only overwrite balance when we successfully read a row.
      // Do NOT reset to 0 on a missing/failed read — that would wipe the
      // displayed balance on a transient network hiccup or auth race.
      if (!cancelled && bal && bal.balance_usd != null) {
        setBalanceUsd(Number(bal.balance_usd));
      }
      if (!cancelled && prof) {
        setBonusClaimed(!!prof.welcome_bonus_claimed_at);
      }
      const [{ data: pays }, { data: wds }, { data: allClaims }] = await Promise.all([
        supabase.from("payments").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50),
        supabase.from("withdrawals").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50),
        supabase.from("mining_claims").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(200),
      ]);
      if (cancelled) return;
      if (pays) {
        const planPay = pays.find((p) => p.status === "approved" && p.plan_index != null);
        if (planPay) {
          const startedAt = new Date(planPay.created_at).getTime();
          setActivePlan({ index: planPay.plan_index as number, startedAt });
        } else {
          setActivePlan(null);
        }
      }
      const payTx: Txn[] = (pays ?? []).map((p) => ({
        id: `pay-${p.id}`,
        kind: p.status === "rejected" ? "declined" : "deposit",
        amountUsd: Number(p.amount),
        method: p.method ?? undefined,
        status: p.status === "approved" ? "approved" : p.status === "rejected" ? "declined" : "pending",
        at: new Date(p.created_at).getTime(),
        note: p.rejection_reason || (p.status === "approved" ? "Deposit approved" : p.status === "pending" ? "Awaiting confirmation" : undefined),
      }));
      const wdTx: Txn[] = (wds ?? []).map((w) => ({
        id: `wd-${w.id}`,
        kind: w.status === "rejected" ? "declined" : "withdraw",
        amountUsd: Number(w.amount),
        method: w.wallet_address ? "Crypto" : (w.currency ?? undefined),
        status: w.status === "approved" ? "approved" : w.status === "rejected" ? "declined" : "pending",
        at: new Date(w.created_at).getTime(),
        note: w.status === "approved" ? "Withdrawal approved" : w.status === "pending" ? "Awaiting confirmation" : undefined,
      }));
      const mineTx: Txn[] = (allClaims ?? []).map((c) => ({
        id: `mine-${c.id}`,
        kind: "mining",
        amountUsd: Number(c.amount_usd),
        status: "credited",
        at: new Date(c.created_at).getTime(),
        note: `Mining reward${c.plan_index != null ? ` · Plan ${(c.plan_index as number) + 1}` : ""}`,
      }));
      if (cancelled) return;
      setTransactions([...payTx, ...wdTx, ...mineTx].sort((a, b) => b.at - a.at));
      const cutoff = Date.now() - DAY;
      setRecentMines((allClaims ?? [])
        .map((c) => new Date(c.created_at).getTime())
        .filter((t) => t >= cutoff));
    }

    async function subscribe(uid: string) {
      if (channel) return;
      channel = supabase.channel(`user-${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "wallet_balances", filter: `user_id=eq.${uid}` },
          (payload) => { const n = payload.new as { balance_usd?: number } | null; if (n?.balance_usd != null) setBalanceUsd(Number(n.balance_usd)); })
        .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${uid}` }, () => { void loadUserState(uid); })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          (payload) => {
            const n = payload.new as { title?: string; body?: string; kind?: string } | null;
            if (!n?.title) return;
            const isApproval = /approved/i.test(n.title) || n.title.includes("🎉");
            if (isApproval) {
              setCongrats({ title: n.title, body: n.body || "Your payment has been approved successfully." });
            } else {
              push({ title: n.title, message: n.body || undefined, kind: "info" });
            }
          })
        .subscribe();
    }

    async function bootstrap(uid: string) {
      if (loadedUid === uid) return;
      loadedUid = uid;
      await loadUserState(uid);
      await subscribe(uid);
    }

    // Prime immediately from the restored session, then keep listening for
    // subsequent SIGNED_IN / TOKEN_REFRESHED events so a fresh login always
    // reloads the persisted balance instead of showing the initial 0.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.user) void bootstrap(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
        void bootstrap(session.user.id);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);


  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);


  const planExpiresAt = activePlan ? activePlan.startedAt + PLAN_DURATION : 0;
  const planActive = activePlan !== null && now < planExpiresAt;
  const planExpired = activePlan !== null && now >= planExpiresAt;
  // Mining resets whenever a new plan is activated (upgrades reopen mining immediately).
  const planStartedAt = activePlan?.startedAt ?? 0;
  const minesInWindow = recentMines.filter(t => t >= planStartedAt && now - t < DAY);
  const minesUsedToday = minesInWindow.length;
  const nextMineAt = minesUsedToday >= MAX_DAILY_MINES && minesInWindow.length ? Math.min(...minesInWindow) + DAY : 0;
  const mineReady = planActive && minesUsedToday < MAX_DAILY_MINES;
  const currentPlan = activePlan ? PREMIUM_PLANS[activePlan.index] : null;
  // Enforce "one pending deposit at a time" on the frontend as well.
  const hasPendingDeposit = transactions.some(t => t.kind === "deposit" && t.status === "pending");

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const claimBonus = async () => {
    if (bonusClaimed) {
      push({ title: "Welcome bonus already claimed", kind: "info" });
      return;
    }
    // Atomic + one-time server-side claim. The DB function refuses a second call.
    const { data, error } = await supabase.rpc("claim_welcome_bonus");
    if (error) {
      if (/already claimed/i.test(error.message)) {
        setBonusClaimed(true);
        push({ title: "Welcome bonus already claimed", kind: "info" });
      } else {
        push({ title: "Bonus failed", message: error.message, kind: "error" });
      }
      return;
    }
    setBonusClaimed(true);
    if (typeof data === "number") setBalanceUsd(data);
    addTxn({ kind: "bonus", amountUsd: 2, status: "credited", note: "Welcome bonus" });
    push({ title: "Welcome bonus credited", message: "+$2.00 added to your wallet", kind: "bonus" });
  };

  const mine = async () => {
    if (!mineReady || !currentPlan || !activePlan) return;
    const reward = currentPlan.mineReward;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const uid = u.user.id;
    // 1. Record the claim (idempotency: mining_claims has its own row per tap)
    const { error: cErr } = await supabase.from("mining_claims").insert({
      user_id: uid, amount_usd: reward, plan_index: activePlan.index,
    });
    if (cErr) { push({ title: "Mining failed", message: cErr.message, kind: "error" }); return; }
    // 2. Atomically credit the wallet through the DB function (RLS-safe, persistent)
    const { data: newBal, error: bErr } = await supabase.rpc("adjust_wallet_balance", { p_delta: reward });
    if (bErr) { push({ title: "Reward not credited", message: bErr.message, kind: "error" }); return; }
    if (typeof newBal === "number") setBalanceUsd(newBal);
    setRecentMines(prev => [...prev, Date.now()]);
    addTxn({ kind: "mining", amountUsd: reward, status: "credited", note: `Mining reward · Plan ${activePlan.index + 1}` });
    push({ title: "Mining reward", message: `+$${reward.toFixed(2)} credited to your wallet`, kind: "reward" });
    if (minesUsedToday + 1 >= MAX_DAILY_MINES) {
      setCongrats({
        title: "🎉 Congratulations!",
        body: "Your today's tasks are completed. Please come back after 24 hours to continue mining.",
      });
    }
  };

  const activatePlan = () => {
    if (hasPendingDeposit) {
      push({
        title: "Deposit pending review",
        message: "Your payment request is still pending. Please wait until it has been approved or rejected before submitting another deposit.",
        kind: "info",
      });
      return;
    }
    if (planActive && activePlan && selectedPlan <= activePlan.index) {
      push({
        title: "Plan already active",
        message: `${PREMIUM_PLANS[activePlan.index].name} is your active plan. Choose a higher plan to upgrade.`,
        kind: "info",
      });
      return;
    }
    setPaymentStep("choose");
    setPaymentMethod(null);
    setReceiptFile(null);
    setOpenPremium(false);
    setOpenPayment(true);
  };

  const selectMethod = (methodId: string) => {
    setPaymentMethod(methodId);
    setReceiptFile(null);
    if (methodId === "card") {
      setPaymentStep("comingSoon");
    } else {
      setPaymentStep("instructions");
    }
  };

  const submitPayment = async () => {
    if (hasPendingDeposit) {
      setPaymentStep("choose");
      push({
        title: "Deposit pending review",
        message: "Your payment request is still pending. Please wait until it has been approved or rejected before submitting another deposit.",
        kind: "info",
      });
      return;
    }
    setPaymentStep("processing");
    const amt = PREMIUM_PLANS[selectedPlan].invest;
    const methodLabel = paymentMethod === "crypto" ? "Crypto" : paymentMethod === "ngn" ? "NGN Bank Transfer" : "Card";
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      let receiptPath: string | null = null;
      if (receiptFile) {
        const ext = receiptFile.name.split(".").pop() || "png";
        receiptPath = `${u.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(receiptPath, receiptFile, { contentType: receiptFile.type || "image/png" });
        if (upErr) throw upErr;
      }
      const { error: insErr } = await supabase.from("payments").insert({
        user_id: u.user.id,
        amount: amt,
        currency: "USD",
        method: methodLabel,
        receipt_url: receiptPath,
        plan_index: selectedPlan,
        status: "pending",
      });
      if (insErr) throw insErr;
      setPaymentStep("pending");
      addTxn({ kind: "deposit", amountUsd: amt, method: methodLabel, status: "pending", note: `Premium plan activation · awaiting confirmation` });
    } catch (e) {
      setPaymentStep("pending");
      showToast(`Could not submit: ${(e as Error).message}`);
    }
  };

  const downloadReceipt = (t: Txn) => {
    try {
      const receiptNo = `FC-${t.id.slice(0, 8).toUpperCase()}`;
      const typeLabel = t.kind === "deposit" ? "Deposit" : t.kind === "withdraw" ? "Withdrawal" : t.kind === "mining" ? "Mining Reward" : t.kind === "bonus" ? "Bonus" : "Declined";
      const statusColor = t.status === "approved" || t.status === "credited" ? "#0e6b3f" : t.status === "pending" ? "#d97706" : "#dc2626";
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${receiptNo}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f2f5f3;color:#0b1e1a;padding:24px}
  .receipt{max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(14,107,63,.12)}
  .head{background:linear-gradient(135deg,#0f7a47,#0a5a34);color:#fff;padding:28px;text-align:center;position:relative}
  .brand{font-size:28px;font-weight:900;letter-spacing:-.5px}
  .tag{font-size:11px;opacity:.85;margin-top:4px;letter-spacing:2px;text-transform:uppercase}
  .stamp{position:absolute;top:20px;right:20px;transform:rotate(-8deg);border:3px solid #fff;color:#fff;padding:6px 12px;border-radius:6px;font-weight:900;font-size:11px;letter-spacing:2px;opacity:.9}
  .amt{padding:24px;text-align:center;border-bottom:1px dashed #e5e7eb}
  .amt small{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700}
  .amt h1{font-size:40px;font-weight:900;margin-top:6px;color:${statusColor}}
  .badge{display:inline-block;margin-top:8px;padding:6px 14px;border-radius:999px;background:${statusColor}15;color:${statusColor};font-weight:800;font-size:12px}
  table{width:100%;border-collapse:collapse;padding:12px}
  td{padding:12px 24px;font-size:13px;border-bottom:1px solid #f1f5f9}
  td:first-child{color:#64748b;font-weight:600}
  td:last-child{text-align:right;font-weight:700;word-break:break-all}
  .foot{padding:20px 24px;text-align:center;background:#f8fafc;font-size:11px;color:#64748b}
  .foot b{color:#0e6b3f}
  .actions{padding:16px;text-align:center;background:#fff;border-top:1px solid #f1f5f9}
  .btn{display:inline-block;padding:10px 20px;background:#0e6b3f;color:#fff;border-radius:999px;font-weight:800;border:none;cursor:pointer;margin:0 4px;font-size:13px}
  @media print{body{background:#fff;padding:0}.receipt{box-shadow:none}.actions{display:none}}
</style></head><body>
<div class="receipt">
  <div class="head">
    <div class="brand">FastCredit</div>
    <div class="tag">Official Receipt</div>
    ${t.status === "approved" || t.status === "credited" ? '<div class="stamp">APPROVED</div>' : ''}
  </div>
  <div class="amt">
    <small>Amount</small>
    <h1>$${t.amountUsd.toFixed(2)}</h1>
    <div class="badge">● ${t.status.toUpperCase()}</div>
  </div>
  <table>
    <tr><td>Receipt No.</td><td>${receiptNo}</td></tr>
    <tr><td>Transaction ID</td><td>${t.id}</td></tr>
    <tr><td>Type</td><td>${typeLabel}</td></tr>
    <tr><td>Date &amp; Time</td><td>${new Date(t.at).toLocaleString()}</td></tr>
    ${t.method ? `<tr><td>Payment Method</td><td>${t.method}</td></tr>` : ''}
    <tr><td>Account</td><td>${userEmail || "user@fastcredit.app"}</td></tr>
    ${t.note ? `<tr><td>Note</td><td>${t.note}</td></tr>` : ''}
  </table>
  <div class="foot">
    Verified by <b>FastCredit</b> · This is an electronically generated receipt.<br/>
    Support: support@fastcreditglobal.com
  </div>
  <div class="actions">
    <button class="btn" onclick="window.print()">Download / Print PDF</button>
  </div>
</div>
</body></html>`;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        // Fallback: download the HTML
        const a = document.createElement("a");
        a.href = url; a.download = `fastcredit-receipt-${receiptNo}.html`;
        document.body.appendChild(a); a.click(); a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showToast(`Receipt ${receiptNo} opened · use Print to save as PDF`);
    } catch {
      showToast("Could not generate receipt");
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(c => (c === key ? null : c)), 1500);
  };

  const closePayment = () => {
    setOpenPayment(false);
    setPaymentStep("choose");
    setPaymentMethod(null);
    setReceiptFile(null);
  };

  const openWithdrawFlow = () => {
    if (!planActive) {
      showToast("You must upgrade your mining plan before you can withdraw your earnings.");
      setOpenPremium(true);
      return;
    }
    if (balanceUsd < MIN_WITHDRAW_USD) {
      showToast(`Your balance must be at least $${MIN_WITHDRAW_USD} before you can make a withdrawal.`);
      return;
    }
    const preselect = COUNTRY_BY_CURRENCY[currency.code]?.code ?? "NG";
    setWdMethod(null);
    setWdCountry(preselect);
    setWdBank("");
    setWdAccountNumber("");
    setWdAccountName("");
    setWdAmount("");
    setWdCrypto(null);
    setWdCryptoSearch("");
    setWdWalletAddress("");
    setWdStep("method");
    setOpenWithdraw(true);
  };
  const closeWithdraw = () => {
    setOpenWithdraw(false);
    setWdStep("method");
  };
  const submitWithdraw = () => {
    setWdStep("processing");
    const amtUsd = Math.max(0, parseFloat(wdAmount || "0")) / (wdMethod === "crypto" ? 1 : (currency.rate || 1));
    const countryInfo = COUNTRY_BY_CODE[wdCountry];
    setTimeout(async () => {
      const method = wdMethod === "crypto"
        ? `${wdCrypto?.name} (${wdCrypto?.symbol}) · ${wdCrypto?.network}`
        : `${countryInfo?.name ?? wdCountry} · ${wdBank}`;
      const note = wdMethod === "crypto"
        ? `To wallet ${wdWalletAddress.slice(0, 10)}…${wdWalletAddress.slice(-6)}`
        : `To ${wdAccountName || "account"} · ${wdAccountNumber}`;
      if (balanceUsd < MIN_WITHDRAW_USD) {
        push({ title: "Balance too low", message: `Your balance must be at least $${MIN_WITHDRAW_USD} before you can make a withdrawal.`, kind: "error" });
        setWdStep("success");
        return;
      }
      if (!(amtUsd > 0) || balanceUsd < amtUsd) {
        addTxn({ kind: "declined", amountUsd: amtUsd, status: "declined", method, note: "Insufficient balance for withdrawal" });
        push({ title: "Insufficient balance", message: "Not enough funds to complete this withdrawal.", kind: "error" });
        setWdStep("success");
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        push({ title: "Not signed in", kind: "error" });
        setWdStep("success");
        return;
      }
      // Reserve the funds first so the user cannot double-withdraw while pending.
      const { data: newBal, error: debitErr } = await supabase.rpc("adjust_wallet_balance", { p_delta: -amtUsd });
      if (debitErr) {
        addTxn({ kind: "declined", amountUsd: amtUsd, status: "declined", method, note: debitErr.message });
        push({ title: "Withdrawal failed", message: debitErr.message, kind: "error" });
        setWdStep("success");
        return;
      }
      if (typeof newBal === "number") setBalanceUsd(newBal);
      // Record the request as PENDING — admin approves/rejects from the panel.
      const { error: insErr } = await supabase.from("withdrawals").insert({
        user_id: u.user.id,
        amount: amtUsd,
        currency: wdMethod === "crypto" ? "USD" : (COUNTRY_BY_CODE[wdCountry]?.currency ?? "USD"),
        wallet_address: wdMethod === "crypto" ? wdWalletAddress : null,
        status: "pending",
      });
      if (insErr) {
        // Roll back the reservation if we couldn't persist the request.
        await supabase.rpc("adjust_wallet_balance", { p_delta: amtUsd });
        push({ title: "Withdrawal failed", message: insErr.message, kind: "error" });
        setWdStep("success");
        return;
      }
      addTxn({ kind: "withdraw", amountUsd: amtUsd, status: "pending", method, note: `${note} · awaiting admin review` });
      push({ title: "Withdrawal submitted", message: `$${amtUsd.toFixed(2)} · pending admin review`, kind: "wallet" });
      setWdStep("success");
    }, 1200);
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

  // Nicegram Premium-inspired dark theme — locked regardless of `dark` toggle.
  const isDark = true;
  const card = "bg-[#141414] text-white border border-white/5";
  const softText = "text-white/50";
  void isDark;

  const shortcuts: { icon: typeof Wallet; label: string; onClick: () => void }[] = [
    { icon: Wallet, label: "Wallet", onClick: () => setOpenCategory("savings") },
    { icon: ArrowDownLeft, label: "Deposit", onClick: () => setOpenPremium(true) },
    { icon: ArrowUpRight, label: "Withdraw", onClick: openWithdrawFlow },
    { icon: Send, label: "Transfer", onClick: () => setOpenCategory("payments") },
    { icon: Download, label: "Request", onClick: () => setOpenCategory("payments") },
    { icon: ArrowLeftRight, label: "Exchange", onClick: () => setOpenCur(true) },
    { icon: Gift, label: "Rewards", onClick: () => setOpenCategory("donation") },
    { icon: UserPlus, label: "Referral", onClick: () => setOpenProfile(true) },
    { icon: Users, label: "Community", onClick: () => setOpenCategory("community") },
    { icon: Clock, label: "History", onClick: () => setOpenCategory("history") },
    { icon: LifeBuoy, label: "Support", onClick: () => setOpenCategory("support") },
    { icon: SettingsIcon, label: "Settings", onClick: () => setOpenProfile(true) },
  ];

  const initials = (userProfile.name || userProfile.username || userProfile.email || "F")
    .split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  const shortId = ((userProfile.referral_code || userProfile.email || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "FC000000").toUpperCase();
  const progressPct = Math.min(100, Math.round((balanceUsd / Math.max(50, MIN_WITHDRAW_USD)) * 100));

  return (
    <div className="min-h-screen w-full bg-[#0D0D0D] text-white transition-colors">
      {/* Ambient gold glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(212,175,55,0.18),transparent_70%)]" />

      <div className="relative mx-auto max-w-[440px] px-4 pt-6 pb-32">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => setOpenProfile(true)} className="flex items-center gap-3 text-left active:scale-95 transition">
            <div className="relative">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#F4CF5B] via-[#D4AF37] to-[#8a6b1e] p-[2px] shadow-[0_0_20px_rgba(212,175,55,0.35)]">
                <div className="h-full w-full rounded-[14px] bg-[#141414] grid place-items-center font-black text-[#D4AF37] overflow-hidden">
                  {userProfile.avatar_url
                    ? <img src={userProfile.avatar_url} alt="" className="h-full w-full object-cover rounded-[14px]" />
                    : initials || "F"}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#D4AF37] grid place-items-center ring-2 ring-[#0D0D0D]">
                <Crown className="h-2.5 w-2.5 text-[#0D0D0D]" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-white/50">FastCredit Support</p>
              <p className="font-bold leading-tight truncate">{userProfile.name || userProfile.username || "FastCredit user"}</p>
              <p className="text-[10px] text-white/40 font-mono">ID · {shortId}</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1.5 backdrop-blur">
              <UserPlus className="h-3 w-3 text-[#D4AF37]" />
              <span className="text-[11px] font-bold tabular-nums">0</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1.5 backdrop-blur">
              <Coins className="h-3 w-3 text-[#D4AF37]" />
              <span className="text-[11px] font-bold tabular-nums">{Math.floor(balanceUsd)}</span>
            </div>
            <button className="h-9 w-9 grid place-items-center rounded-full bg-white/[0.06] border border-white/10 backdrop-blur relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            </button>
          </div>
        </div>

        {/* Premium Balance Card */}
        <section className="mt-6 relative rounded-[24px] p-[1px] bg-gradient-to-br from-[#D4AF37]/60 via-white/5 to-transparent shadow-[0_20px_60px_-20px_rgba(212,175,55,0.35)]">
          <div className="rounded-[23px] bg-gradient-to-br from-[#181512] via-[#0F0F0F] to-[#0D0D0D] p-5 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.25),transparent_65%)]" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12),transparent_70%)]" />

            <div className="flex items-center justify-between relative">
              <p className="text-[11px] uppercase tracking-widest text-white/50">Total Balance</p>
              <div className="relative">
                <button onClick={() => setOpenCur(o => !o)} className="rounded-full bg-white/[0.08] border border-white/10 px-3 py-1.5 text-[11px] font-bold flex items-center gap-1 backdrop-blur">
                  {currency.code} <ChevronDown className="h-3 w-3" />
                </button>
                {openCur && (
                  <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-[#151515] border border-white/10 shadow-2xl z-30 overflow-hidden">
                    {CURRENCIES.map(c => (
                      <button key={c.code} onClick={() => { changeCurrency(c); setOpenCur(false); }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-white/5 ${c.code === currency.code ? "font-bold text-[#D4AF37]" : "text-white/80"}`}>
                        {c.symbol} {c.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-end relative">
              <span className="text-[42px] leading-none font-extrabold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">{bal.int}</span>
              <span className="text-2xl font-bold text-white/60">.{bal.dec}</span>
            </div>

            <div className="mt-5 flex items-center gap-2 relative">
              <button className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/[0.06] border border-white/10 py-3 text-sm font-semibold backdrop-blur active:scale-95 transition">
                <ArrowDownLeft className="h-4 w-4" /> Request
              </button>
              <button onClick={openWithdrawFlow} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/[0.06] border border-white/10 py-3 text-sm font-semibold backdrop-blur active:scale-95 transition">
                <ArrowUpRight className="h-4 w-4" /> Withdraw
              </button>
            </div>

            <button
              onClick={() => setOpenPremium(true)}
              className="mt-3 relative w-full rounded-2xl py-3.5 text-sm font-black text-[#2a1c00] bg-gradient-to-r from-[#F4CF5B] via-[#D4AF37] to-[#B8871A] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.55)] flex items-center justify-center gap-2 active:scale-[0.98] transition overflow-hidden group"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
              <Crown className="h-4 w-4 relative" /> <span className="relative">Upgrade to FastCredit Premium</span>
            </button>
          </div>
        </section>

        {/* Reward Campaign Banner */}
        <button onClick={() => setOpenCategory("donation")} className="mt-4 w-full text-left group">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#B8871A] via-[#D4AF37] to-[#F4CF5B] p-4 shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)]">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
            <Coins className="absolute -right-2 top-2 h-16 w-16 text-white/20 animate-bounce [animation-duration:3s]" />
            <Coins className="absolute right-10 bottom-1 h-8 w-8 text-white/25 animate-bounce [animation-duration:2s] [animation-delay:-0.5s]" />
            <div className="relative flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#0D0D0D]/25 backdrop-blur grid place-items-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-[#2a1c00]/70 font-bold">Limited Time</p>
                <p className="font-black text-[#2a1c00] leading-tight">Join FastCredit Reward Campaign</p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#2a1c00] group-hover:translate-x-1 transition" />
            </div>
          </div>
        </button>

        {/* Promotional Card — FastCredit Premium */}
        <button onClick={() => setOpenPremium(true)} className="mt-3 w-full text-left group">
          <div className="rounded-2xl p-[1px] bg-gradient-to-br from-[#D4AF37]/40 via-white/5 to-transparent">
            <div className="rounded-[15px] bg-[#141414] p-4 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15),transparent_70%)]" />
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#F4CF5B] to-[#B8871A] grid place-items-center shadow-lg shrink-0">
                <ShieldCheck className="h-6 w-6 text-[#0D0D0D]" />
              </div>
              <div className="flex-1 min-w-0 relative">
                <p className="font-bold text-white leading-tight">FastCredit Premium</p>
                <p className="text-[11px] text-white/50 leading-tight mt-0.5">Secure Global Financial Services</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#D4AF37] group-hover:translate-x-1 transition" />
            </div>
          </div>
        </button>

        {/* Progress Section */}
        <section className="mt-4 rounded-2xl bg-[#141414] border border-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-[#D4AF37]" />
              <p className="font-bold text-sm">Get FastCredit Premium</p>
            </div>
            <span className="text-[11px] font-bold text-[#D4AF37] tabular-nums">{progressPct}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#B8871A] via-[#D4AF37] to-[#F4CF5B] shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-white/40">Reach ${MIN_WITHDRAW_USD} to unlock full premium withdrawal privileges.</p>
        </section>

        {/* Feature Cards */}
        <section className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { icon: ArrowDownLeft, label: "Deposit Funds", onClick: () => setOpenPremium(true) },
            { icon: ArrowUpRight, label: "Withdraw Funds", onClick: openWithdrawFlow },
            { icon: Users, label: "Join Community", onClick: () => setOpenCategory("community") },
          ].map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="rounded-2xl bg-[#141414] border border-white/5 p-4 flex flex-col items-center gap-2 active:scale-95 hover:border-[#D4AF37]/30 transition"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#D4AF37]/25 to-[#D4AF37]/5 border border-[#D4AF37]/20 grid place-items-center">
                <Icon className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
            </button>
          ))}
        </section>

        {/* Services Section */}
        <section className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-base">FastCredit Services</p>
              <p className="text-[11px] text-white/40">Global Financial Platform</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {shortcuts.map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="rounded-2xl bg-[#141414] border border-white/5 aspect-square flex flex-col items-center justify-center gap-1.5 active:scale-95 hover:border-[#D4AF37]/30 hover:bg-[#181818] transition shadow-[0_4px_15px_-8px_rgba(0,0,0,0.5)]"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-transparent grid place-items-center">
                  <Icon className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <span className="text-[10px] font-semibold text-white/80">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Mining panel — kept for functionality, restyled */}
        {(planActive || planExpired) && (
          <section className="mt-5 rounded-2xl bg-[#141414] border border-white/5 overflow-hidden">
            <div className="p-4 relative">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15),transparent_70%)]" />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/25 to-transparent border border-[#D4AF37]/20 grid place-items-center">
                    <Pickaxe className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="font-bold leading-tight">Premium Mining</p>
                    <p className="text-[10px] text-white/50 flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${planActive ? "bg-[#D4AF37] animate-pulse" : "bg-red-400"}`} />
                      {planActive
                        ? `${currentPlan?.name} · ${formatCountdown(planExpiresAt - now)} left`
                        : "Plan expired"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase">Reward</p>
                  <p className="text-sm font-bold text-[#D4AF37]">{currentPlan ? fmt(currentPlan.mineReward, 2) : "—"}</p>
                </div>
              </div>
              <button
                onClick={planActive ? mine : () => setOpenPremium(true)}
                disabled={planActive && !mineReady}
                className={`mt-4 w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition ${
                  !planActive
                    ? "bg-gradient-to-r from-[#F4CF5B] via-[#D4AF37] to-[#B8871A] text-[#2a1c00]"
                    : mineReady
                    ? "bg-gradient-to-r from-[#F4CF5B] via-[#D4AF37] to-[#B8871A] text-[#2a1c00] active:scale-95"
                    : "bg-white/[0.06] text-white/40 border border-white/5"
                }`}
              >
                {!planActive ? (
                  <><Crown className="h-4 w-4" /> {planExpired ? "Renew Plan" : "Activate Premium"}</>
                ) : mineReady ? (
                  <><Pickaxe className="h-4 w-4" /> Mine {currentPlan ? fmt(currentPlan.mineReward, 2) : ""}</>
                ) : (
                  <><Pause className="h-4 w-4" /> Cooldown {formatCountdown(nextMineAt - now)}</>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Welcome bonus */}
        {!bonusClaimed && (
          <section className="mt-4">
            <div className="rounded-2xl p-4 flex items-center gap-3 bg-[#141414] border border-[#D4AF37]/20">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8a6b1e] grid place-items-center text-[#0D0D0D] shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Welcome bonus</p>
                <p className="font-extrabold text-lg leading-tight">{fmt(2, 2)} <span className="text-[11px] font-medium text-white/40">≈ $2 USD</span></p>
              </div>
              <button
                onClick={claimBonus}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#F4CF5B] to-[#B8871A] text-[#2a1c00] active:scale-95"
              >
                Claim
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Bottom nav — Nicegram-style floating pill */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-40">
        <div className="rounded-full bg-[#141414]/90 backdrop-blur-xl border border-white/10 flex items-center justify-around px-2 py-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
          {[
            { icon: Home, label: "Home", key: "home", onClick: () => { setOpenCategory(null); setOpenProfile(false); setOpenPayment(false); setOpenPremium(false); setOpenWithdraw(false); window.scrollTo({ top: 0, behavior: "smooth" }); } },
            { icon: Wallet, label: "Wallet", key: "savings", onClick: () => setOpenCategory("savings") },
            { icon: Gift, label: "Rewards", key: "donation", onClick: () => setOpenCategory("donation") },
            { icon: Users, label: "Community", key: "community", onClick: () => setOpenCategory("community") },
            { icon: User, label: "Profile", key: "profile", onClick: () => setOpenProfile(true) },
          ].map(({ icon: Icon, label, key, onClick }) => {
            const active =
              (key === "home" && !openCategory && !openProfile) ||
              (key === "profile" && openProfile) ||
              openCategory === key;
            return (
              <button
                key={key}
                onClick={onClick}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition ${
                  active ? "bg-gradient-to-br from-[#D4AF37]/25 to-transparent" : ""
                }`}
                aria-label={label}
              >
                <Icon className={`h-5 w-5 ${active ? "text-[#D4AF37]" : "text-white/60"}`} />
                <span className={`text-[9px] font-bold ${active ? "text-[#D4AF37]" : "text-white/50"}`}>{label}</span>
              </button>
            );
          })}
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
                  <p className="text-[10px] font-semibold opacity-80">7 days · 2 mining taps daily</p>
                </div>
              </div>
              <button onClick={() => setOpenPremium(false)} className="h-8 w-8 grid place-items-center rounded-full bg-black/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-amber-50"} border ${isDark ? "border-white/10" : "border-amber-200"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${softText}`}>Starting investment</p>
                <p className="mt-1 text-3xl font-extrabold text-amber-600">{fmt(PREMIUM_PLANS[0].invest, ["USD","EUR","GBP"].includes(currency.code) ? 2 : 0)}</p>
                <p className={`mt-1 text-[11px] ${softText}`}>≈ ${PREMIUM_PLANS[0].invest} USD · Shown in {currency.code}</p>
              </div>

              {hasPendingDeposit && (
                <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-[11px] font-semibold">
                  Your payment request is still pending. Please wait until it has been approved or rejected before submitting another deposit.
                </div>
              )}

              <p className={`mt-5 text-xs font-bold uppercase tracking-wide ${softText}`}>Choose a plan</p>
              <div className="mt-3 space-y-2">
                {PREMIUM_PLANS.map((p, i) => {
                  const dec = ["USD", "EUR", "GBP"].includes(currency.code) ? 2 : 0;
                  const active = selectedPlan === i;
                  const isCurrentActive = planActive && activePlan?.index === i;
                  const isLowerThanActive = planActive && activePlan != null && i < activePlan.index;
                  const locked = isCurrentActive || isLowerThanActive;
                  return (
                    <button
                      key={p.invest}
                      onClick={() => { if (!locked) setSelectedPlan(i); }}
                      disabled={locked}
                      aria-disabled={locked}
                      className={`w-full text-left rounded-2xl p-4 border transition ${
                        locked
                          ? isCurrentActive
                            ? "border-emerald-500 bg-emerald-50 text-[#0b1e1a] shadow-sm cursor-not-allowed opacity-100"
                            : "border-black/5 bg-black/[.03] opacity-60 cursor-not-allowed"
                          : active
                            ? "border-amber-500 bg-amber-50 text-[#0b1e1a] shadow-md"
                            : isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full grid place-items-center ${isCurrentActive ? "bg-emerald-500 text-white" : active ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700"}`}>
                            {isCurrentActive ? <Check className="h-4 w-4" /> : active ? <Check className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-extrabold flex items-center gap-2">
                              {p.name} · {fmt(p.invest, dec)}
                              {isCurrentActive && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wide px-2 py-0.5">
                                  Active Plan
                                </span>
                              )}
                              {isLowerThanActive && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-300 text-slate-700 text-[9px] font-black uppercase tracking-wide px-2 py-0.5">
                                  Locked
                                </span>
                              )}
                            </p>
                            <p className={`text-[10px] ${active || isCurrentActive ? "text-[#0b1e1a]/60" : softText}`}>
                              {isCurrentActive ? "Currently active — upgrade to a higher plan" : isLowerThanActive ? "Upgrades only — cannot downgrade" : "Deposit"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-emerald-600">{fmt(p.mineReward, 2)}</p>
                          <p className={`text-[10px] ${active || isCurrentActive ? "text-[#0b1e1a]/60" : softText}`}>per mining tap</p>
                        </div>
                      </div>
                      <div className={`mt-3 grid grid-cols-2 gap-2 text-[11px] ${active || isCurrentActive ? "text-[#0b1e1a]/80" : softText}`}>
                        <div className={`rounded-lg px-2 py-1.5 ${active || isCurrentActive ? "bg-white" : isDark ? "bg-white/5" : "bg-[#f6f8f7]"}`}>
                          <p className="opacity-70">Per day (2 taps)</p>
                          <p className={`font-bold ${active || isCurrentActive ? "text-[#0b1e1a]" : ""}`}>{fmt(p.profit, 2)}</p>
                        </div>
                        <div className={`rounded-lg px-2 py-1.5 ${active || isCurrentActive ? "bg-white" : isDark ? "bg-white/5" : "bg-[#f6f8f7]"}`}>
                          <p className="opacity-70">Total 7d</p>
                          <p className={`font-bold ${active || isCurrentActive ? "text-[#0b1e1a]" : ""}`}>{fmt(p.total, 2)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className={`mt-4 rounded-2xl p-3 text-[11px] ${isDark ? "bg-white/5 text-white/70" : "bg-[#f6f8f7] text-[#0b1e1a]/70"}`}>
                <p className="font-bold mb-1">How it works</p>
                <ul className="space-y-0.5 list-disc pl-4">
                  <li>Mine twice per day — earnings credit instantly to your wallet.</li>
                  <li>Each plan runs for 7 days, then expires automatically.</li>
                  <li>Upgrading to a higher plan activates it immediately and reopens mining.</li>
                  <li>Only one plan can be active at a time — you can only move to a higher plan.</li>
                </ul>
              </div>

              {(() => {
                const selectedLocked = planActive && activePlan != null && selectedPlan <= activePlan.index;
                const disabled = hasPendingDeposit || selectedLocked;
                const label = hasPendingDeposit
                  ? "Deposit pending review"
                  : selectedLocked
                    ? "Choose a higher plan to upgrade"
                    : `Activate for ${fmt(PREMIUM_PLANS[selectedPlan].invest, ["USD","EUR","GBP"].includes(currency.code) ? 2 : 0)}`;
                return (
                  <button
                    onClick={activatePlan}
                    disabled={disabled}
                    aria-disabled={disabled}
                    className={`mt-4 w-full rounded-full py-3.5 font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
                      disabled
                        ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-400 to-amber-500 text-[#3a2500]"
                    }`}
                  >
                    <Crown className="h-4 w-4" /> {label}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {openPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closePayment}>
          <div onClick={e => e.stopPropagation()} className={`w-full max-w-[440px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl ${isDark ? "bg-[#111f19] text-white" : "bg-white text-[#0b1e1a]"} shadow-2xl`}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-black/5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-3xl">
              <div>
                <p className="font-black text-base leading-tight">Select your method</p>
                <p className="text-[10px] font-semibold opacity-90">Deposit {fmt(PREMIUM_PLANS[selectedPlan].invest, ["USD","EUR","GBP"].includes(currency.code) ? 2 : 0)} to activate</p>
              </div>
              <button onClick={closePayment} className="h-8 w-8 grid place-items-center rounded-full bg-black/15">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {paymentStep === "choose" && (
                <>
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${softText}`}>Payment options</p>
                  <div className="mt-3 space-y-2">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => selectMethod(m.id)}
                        className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left active:scale-[.98] transition ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-black/5 bg-white hover:bg-emerald-50"}`}
                      >
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white grid place-items-center text-xl font-black shrink-0">
                          {m.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold">{m.label}</p>
                          <p className={`text-[11px] ${softText}`}>{m.desc}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 opacity-60" />
                      </button>
                    ))}
                  </div>
                  <p className={`mt-4 text-center text-[11px] ${softText}`}>Secured payments · Encrypted end-to-end</p>
                </>
              )}

              {paymentStep === "instructions" && paymentMethod === "crypto" && (
                <div className="space-y-4">
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${softText}`}>Send exactly {fmt(PREMIUM_PLANS[selectedPlan].invest, 2)} worth</p>

                  {settings.wallets.length === 0 && (
                    <div className={`rounded-2xl border p-4 text-center text-[11px] ${softText}`}>
                      No crypto wallets configured yet. Please contact support.
                    </div>
                  )}
                  {settings.wallets.map((w, idx) => (
                    <div key={w.id} className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/5" : idx === 0 ? "border-black/5 bg-emerald-50/60" : "border-black/5 bg-white"}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-black text-sm">{w.symbol} · {w.network}</p>
                        {idx === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">Recommended</span>}
                      </div>
                      {w.label && <p className={`text-[10px] ${softText}`}>{w.label}</p>}
                      <p className={`mt-1 text-[10px] uppercase tracking-wide ${softText}`}>Wallet Address</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="font-mono text-[11px] break-all flex-1">{w.address}</p>
                        <button onClick={() => copyText(w.address, `w-${w.id}`)} className="h-8 w-8 grid place-items-center rounded-full bg-emerald-500 text-white shrink-0">
                          {copied === `w-${w.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}


                  <ReceiptUpload receiptFile={receiptFile} setReceiptFile={setReceiptFile} isDark={isDark} softText={softText} />

                  <button
                    disabled={!receiptFile}
                    onClick={submitPayment}
                    className={`w-full rounded-full py-3.5 font-black text-sm ${receiptFile ? "bg-[#0e6b3f] text-white" : "bg-black/10 text-black/40"}`}
                  >
                    Submit payment
                  </button>
                </div>
              )}

              {paymentStep === "instructions" && paymentMethod === "ngn" && (
                <div className="space-y-4">
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${softText}`}>Bank transfer · Naira</p>

                  {(() => {
                    const ngnBanks = settings.banks.filter((b) => b.currency === "NGN" || b.currency === currency.code);
                    const active = ngnBanks.length ? ngnBanks : settings.banks;
                    if (active.length === 0) {
                      return <div className={`rounded-2xl border p-4 text-center text-[11px] ${softText}`}>No bank accounts configured yet. Please contact support.</div>;
                    }
                    return active.map((b) => (
                      <div key={b.id} className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-emerald-50/60"}`}>
                        <div>
                          <p className={`text-[10px] uppercase tracking-wide ${softText}`}>Bank</p>
                          <p className="font-black">{b.bank_name} <span className="text-[10px] text-slate-500">({b.currency})</span></p>
                        </div>
                        <div>
                          <p className={`text-[10px] uppercase tracking-wide ${softText}`}>Account Name</p>
                          <p className="font-black">{b.account_name}</p>
                        </div>
                        <div>
                          <p className={`text-[10px] uppercase tracking-wide ${softText}`}>Account Number</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-black text-lg flex-1">{b.account_number}</p>
                            <button onClick={() => copyText(b.account_number, `b-${b.id}`)} className="h-8 w-8 grid place-items-center rounded-full bg-emerald-500 text-white shrink-0">
                              {copied === `b-${b.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className={`text-[10px] uppercase tracking-wide ${softText}`}>Amount</p>
                          <p className="font-black">{fmt(PREMIUM_PLANS[selectedPlan].invest, 2)}</p>
                        </div>
                      </div>
                    ));
                  })()}


                  <ReceiptUpload receiptFile={receiptFile} setReceiptFile={setReceiptFile} isDark={isDark} softText={softText} />

                  <button
                    disabled={!receiptFile}
                    onClick={submitPayment}
                    className={`w-full rounded-full py-3.5 font-black text-sm ${receiptFile ? "bg-[#0e6b3f] text-white" : "bg-black/10 text-black/40"}`}
                  >
                    Submit payment
                  </button>
                </div>
              )}

              {paymentStep === "processing" && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="h-14 w-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <p className="font-bold">Processing payment…</p>
                  <p className={`text-[11px] ${softText}`}>
                    {paymentMethod === "crypto" && "Waiting for blockchain confirmation"}
                    {paymentMethod === "ngn" && "Confirming your NGN transfer"}
                    {paymentMethod === "card" && "Verifying your card details"}
                  </p>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="flex flex-col items-center py-8 gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 grid place-items-center text-white">
                    <Check className="h-8 w-8" />
                  </div>
                  <p className="font-black text-lg">Plan activated!</p>
                  <p className={`text-xs ${softText}`}>You can mine your first reward now. Payouts every 48h for 14 days.</p>
                  <button onClick={closePayment} className="mt-3 w-full rounded-full bg-[#0e6b3f] text-white py-3.5 font-black text-sm">
                    Go to Dashboard
                  </button>
                </div>
              )}

              {paymentStep === "pending" && (
                <div className="flex flex-col items-center py-8 gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-amber-500 grid place-items-center text-white">
                    <Clock className="h-8 w-8" />
                  </div>
                  <p className="font-black text-lg">Pending payment</p>
                  <p className={`text-xs ${softText}`}>
                    We received your submission. Your payment is being reviewed and will be confirmed shortly. You'll be notified once your plan is activated.
                  </p>
                  <div className={`w-full rounded-2xl border p-3 text-left text-[11px] ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-amber-50/60"}`}>
                    <p className={`${softText} uppercase tracking-wide font-bold text-[10px]`}>Status</p>
                    <p className="font-black text-amber-600">Awaiting confirmation</p>
                  </div>
                  <button onClick={closePayment} className="mt-2 w-full rounded-full bg-[#0e6b3f] text-white py-3.5 font-black text-sm">
                    Got it
                  </button>
                </div>
              )}

              {paymentStep === "comingSoon" && (
                <div className="flex flex-col items-center py-10 gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-[#0e6b3f]/10 grid place-items-center text-[#0e6b3f]">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <p className="font-black text-lg">Card payments coming soon</p>
                  <p className={`text-xs ${softText}`}>
                    We're working on card support (Visa, Mastercard, Verve). For now, please use Crypto or NGN bank transfer.
                  </p>
                  <div className="mt-2 w-full flex gap-2">
                    <button onClick={() => { setPaymentMethod(null); setPaymentStep("choose"); }} className={`flex-1 rounded-full py-3 font-bold text-sm border ${isDark ? "border-white/10" : "border-black/10"}`}>
                      Back
                    </button>
                    <button onClick={() => selectMethod("crypto")} className="flex-1 rounded-full bg-[#0e6b3f] text-white py-3 font-black text-sm">
                      Use Crypto
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {openWithdraw && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4" onClick={closeWithdraw}>
          <div onClick={e => e.stopPropagation()} className={`w-full sm:max-w-[440px] h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-y-auto sm:rounded-3xl ${card} shadow-2xl flex flex-col`}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0e6b3f] to-[#0a4a2c] text-white sm:rounded-t-3xl" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <ArrowUpRight className="h-4 w-4 shrink-0" />
                <p className="font-black text-base truncate">
                  Withdraw
                  {wdMethod === "bank" && wdStep !== "method" && wdStep !== "country" && COUNTRY_BY_CODE[wdCountry] && (
                    <span className="ml-2 text-xs opacity-80">· {COUNTRY_BY_CODE[wdCountry].flag} {COUNTRY_BY_CODE[wdCountry].name}</span>
                  )}
                  {wdMethod === "crypto" && wdCrypto && (
                    <span className="ml-2 text-xs opacity-80">· {wdCrypto.symbol}</span>
                  )}
                </p>
              </div>
              <button onClick={closeWithdraw} className="h-8 w-8 grid place-items-center rounded-full bg-black/20 shrink-0"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-5 flex-1">
              {wdStep === "method" && (
                <div className="space-y-3">
                  <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>Choose withdrawal method</p>
                  <button
                    onClick={() => { setWdMethod("bank"); setWdStep("country"); }}
                    className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left active:scale-[0.98] transition ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                  >
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-[#0e6b3f] grid place-items-center text-2xl shrink-0">🏦</div>
                    <div className="min-w-0">
                      <p className="font-black text-sm">Bank account</p>
                      <p className={`text-[11px] ${softText}`}>Withdraw to your local bank</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setWdMethod("crypto"); setWdStep("crypto"); }}
                    className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left active:scale-[0.98] transition ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                  >
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center text-2xl shrink-0">₿</div>
                    <div className="min-w-0">
                      <p className="font-black text-sm">Cryptocurrency wallet</p>
                      <p className={`text-[11px] ${softText}`}>BTC, ETH, USDT and more</p>
                    </div>
                  </button>
                </div>
              )}

              {wdStep === "country" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>Select your country</p>
                    <button onClick={() => setWdStep("method")} className="text-[11px] font-bold text-[#0e6b3f]">Back</button>
                  </div>
                  <p className={`text-[11px] ${softText}`}>Search any country. We'll load the banks supported for withdrawal there.</p>
                  <label className="block mt-2">
                    <input
                      value={wdCountrySearch}
                      onChange={(e) => setWdCountrySearch(e.target.value)}
                      placeholder="Search country or currency (e.g. Nigeria, USD)"
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#0e6b3f] ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : "bg-white border-black/10"}`}
                    />
                  </label>
                  <div className="mt-2 max-h-[55vh] overflow-y-auto space-y-1.5 pr-1">
                    {(() => {
                      const q = wdCountrySearch.trim().toLowerCase();
                      const list = q
                        ? COUNTRIES.filter(c =>
                            c.name.toLowerCase().includes(q) ||
                            c.code.toLowerCase().includes(q) ||
                            c.currency.toLowerCase().includes(q))
                        : COUNTRIES;
                      if (list.length === 0) {
                        return <p className={`text-xs ${softText} py-4 text-center`}>No countries match "{wdCountrySearch}"</p>;
                      }
                      return list.map((info) => {
                        const isActive = wdCountry === info.code;
                        return (
                          <button
                            key={info.code}
                            onClick={() => { setWdCountry(info.code); setWdBank(""); setWdBanksList([]); setWdStep("bank"); }}
                            className={`w-full flex items-center justify-between rounded-2xl border p-3 text-left active:scale-[0.98] transition ${isActive ? "border-[#0e6b3f] bg-emerald-50" : isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-2xl shrink-0">{info.flag}</span>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{info.name}</p>
                                <p className={`text-[11px] ${softText}`}>{info.code} · {info.currency}</p>
                              </div>
                            </div>
                            <ArrowUpRight className="h-4 w-4 opacity-60 shrink-0" />
                          </button>
                        );
                      });
                    })()}
                  </div>
                  <button
                    onClick={() => { setWdBank(""); setWdStep("bank"); }}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold active:scale-[0.98] transition ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh banks for {COUNTRY_BY_CODE[wdCountry]?.name ?? wdCountry}
                  </button>
                </div>
              )}

              {wdStep === "bank" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>
                      Select your bank
                      {COUNTRY_BY_CODE[wdCountry] && (
                        <span className="ml-1 opacity-70">· {COUNTRY_BY_CODE[wdCountry].flag} {COUNTRY_BY_CODE[wdCountry].name}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadBanks(wdCountry)}
                        disabled={wdBanksLoading}
                        className="text-[11px] font-bold text-[#0e6b3f] disabled:opacity-50 flex items-center gap-1"
                      >
                        <RefreshCw className={`h-3 w-3 ${wdBanksLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                      <button onClick={() => setWdStep("country")} className="text-[11px] font-bold text-[#0e6b3f]">Change country</button>
                    </div>
                  </div>
                  <label className="block">
                    <input
                      value={wdBankSearch}
                      onChange={(e) => setWdBankSearch(e.target.value)}
                      placeholder="Search bank"
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#0e6b3f] ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : "bg-white border-black/10"}`}
                    />
                  </label>
                  {wdBanksSource === "flutterwave" && (
                    <p className="text-[10px] text-emerald-600 font-semibold">Live list from payment provider</p>
                  )}
                  <div className="mt-2 max-h-[55vh] overflow-y-auto space-y-1.5 pr-1">
                    {wdBanksLoading && (
                      <p className={`text-xs ${softText} py-4 text-center`}>Loading banks…</p>
                    )}
                    {!wdBanksLoading && wdBanksList.length === 0 && (
                      <div className="py-6 text-center space-y-2">
                        <p className={`text-xs ${softText}`}>
                          No banks bundled for {COUNTRY_BY_CODE[wdCountry]?.name ?? wdCountry} yet.
                        </p>
                        <button
                          onClick={() => { setWdBank("Other bank"); setWdStep("details"); }}
                          className="text-xs font-bold text-[#0e6b3f] underline"
                        >
                          Enter my bank manually
                        </button>
                      </div>
                    )}
                    {!wdBanksLoading && (() => {
                      const q = wdBankSearch.trim().toLowerCase();
                      const list = q
                        ? wdBanksList.filter((b) => b.name.toLowerCase().includes(q))
                        : wdBanksList;
                      if (q && list.length === 0) {
                        return <p className={`text-xs ${softText} py-4 text-center`}>No banks match "{wdBankSearch}"</p>;
                      }
                      return list.map((b) => {
                        const isActive = wdBank === b.name;
                        return (
                          <button
                            key={`${b.name}-${b.code ?? ""}`}
                            onClick={() => { setWdBank(b.name); setWdStep("details"); }}
                            className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left ${isActive ? "border-[#0e6b3f] bg-emerald-50" : isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                          >
                            <span className="font-semibold text-sm truncate">{b.name}</span>
                            <ChevronDown className="h-4 w-4 -rotate-90 opacity-50 shrink-0" />
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}


              {wdStep === "details" && (
                <div className="space-y-3">
                  <div className={`rounded-2xl p-3 ${isDark ? "bg-white/5" : "bg-emerald-50"} flex items-center justify-between gap-2`}>
                    <div className="min-w-0">
                      <p className={`text-[10px] uppercase font-bold ${softText}`}>Selected bank</p>
                      <p className="font-black text-sm truncate">{wdBank}</p>
                      <p className={`text-[10px] ${softText}`}>{COUNTRY_BY_CODE[wdCountry]?.flag} {COUNTRY_BY_CODE[wdCountry]?.name}</p>
                    </div>
                    <button onClick={() => setWdStep("bank")} className="text-[11px] font-bold text-[#0e6b3f] shrink-0">Change</button>
                  </div>

                  <label className="block">
                    <span className={`text-[11px] font-bold ${softText}`}>Account number</span>
                    <input value={wdAccountNumber} onChange={e => setWdAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                      inputMode="numeric" placeholder="10-digit account number"
                      className={`mt-1 w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-[#0e6b3f] ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-black/10"}`} />
                  </label>

                  <label className="block">
                    <span className={`text-[11px] font-bold ${softText}`}>Account name</span>
                    <input value={wdAccountName} onChange={e => setWdAccountName(e.target.value)}
                      placeholder="Full name on account"
                      className={`mt-1 w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-[#0e6b3f] ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-black/10"}`} />
                  </label>

                  <label className="block">
                    <span className={`text-[11px] font-bold ${softText}`}>Amount ({currency.code})</span>
                    <input value={wdAmount} onChange={e => setWdAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal" placeholder={`0.00 ${currency.code}`}
                      className={`mt-1 w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-[#0e6b3f] ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-black/10"}`} />
                    <span className={`mt-1 block text-[10px] ${softText}`}>Available: {fmt(balanceUsd, 2)} · Minimum balance ${MIN_WITHDRAW_USD} required</span>
                  </label>

                  <button
                    onClick={() => setWdStep("review")}
                    disabled={!wdAccountNumber || !wdAccountName || !wdAmount || parseFloat(wdAmount) <= 0}
                    className="mt-2 w-full rounded-full bg-[#0e6b3f] disabled:bg-[#0e6b3f]/40 text-white py-3.5 font-black text-sm active:scale-95"
                  >
                    Review withdrawal
                  </button>
                </div>
              )}

              {wdStep === "crypto" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>Select cryptocurrency</p>
                    <button onClick={() => setWdStep("method")} className="text-[11px] font-bold text-[#0e6b3f]">Back</button>
                  </div>
                  <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDark ? "bg-white/5 border-white/10" : "bg-white border-black/10"}`}>
                    <Search className="h-4 w-4 opacity-60 shrink-0" />
                    <input
                      value={wdCryptoSearch}
                      onChange={e => setWdCryptoSearch(e.target.value)}
                      placeholder="Search coin or symbol…"
                      className="w-full bg-transparent outline-none text-sm"
                    />
                    {wdCryptoSearch && (
                      <button onClick={() => setWdCryptoSearch("")} className="opacity-60"><X className="h-4 w-4" /></button>
                    )}
                  </div>
                  <p className={`text-[10px] uppercase font-bold ${softText}`}>All cryptocurrencies</p>
                  <div className="space-y-1.5">
                    {CRYPTOCURRENCIES
                      .filter(c => {
                        const q = wdCryptoSearch.trim().toLowerCase();
                        if (!q) return true;
                        return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
                      })
                      .map(c => (
                        <button
                          key={c.symbol}
                          onClick={() => { setWdCrypto(c); setWdStep("cryptoDetails"); }}
                          className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left active:scale-[0.98] ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                        >
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white grid place-items-center text-base font-black shrink-0">
                            {c.emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm truncate">{c.name}</p>
                            <p className={`text-[11px] ${softText}`}>{c.symbol} · {c.network}</p>
                          </div>
                          <ChevronDown className="h-4 w-4 -rotate-90 opacity-50 shrink-0" />
                        </button>
                      ))}
                    {CRYPTOCURRENCIES.filter(c => {
                      const q = wdCryptoSearch.trim().toLowerCase();
                      if (!q) return true;
                      return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
                    }).length === 0 && (
                      <p className={`text-center text-xs py-6 ${softText}`}>No coins match "{wdCryptoSearch}"</p>
                    )}
                  </div>
                </div>
              )}

              {wdStep === "cryptoDetails" && wdCrypto && (
                <div className="space-y-3">
                  <div className={`rounded-2xl p-3 ${isDark ? "bg-white/5" : "bg-emerald-50"} flex items-center gap-3`}>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white grid place-items-center text-lg font-black shrink-0">
                      {wdCrypto.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm truncate">{wdCrypto.name}</p>
                      <p className={`text-[10px] ${softText}`}>{wdCrypto.symbol} · {wdCrypto.network}</p>
                    </div>
                    <button onClick={() => setWdStep("crypto")} className="text-[11px] font-bold text-[#0e6b3f] shrink-0">Change</button>
                  </div>

                  <label className="block">
                    <span className={`text-[11px] font-bold ${softText}`}>Destination wallet address</span>
                    <input value={wdWalletAddress} onChange={e => setWdWalletAddress(e.target.value.trim())}
                      placeholder={`Your ${wdCrypto.symbol} wallet address`}
                      className={`mt-1 w-full rounded-xl border px-3 py-3 text-xs font-mono outline-none focus:border-[#0e6b3f] ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-black/10"}`} />
                  </label>

                  <label className="block">
                    <span className={`text-[11px] font-bold ${softText}`}>Amount (USD)</span>
                    <input value={wdAmount} onChange={e => setWdAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal" placeholder="0.00"
                      className={`mt-1 w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-[#0e6b3f] ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-black/10"}`} />
                    <span className={`mt-1 block text-[10px] ${softText}`}>Available: ${balanceUsd.toFixed(2)} · Minimum balance ${MIN_WITHDRAW_USD} required</span>
                  </label>

                  <button
                    onClick={() => setWdStep("review")}
                    disabled={!wdWalletAddress || wdWalletAddress.length < 8 || !wdAmount || parseFloat(wdAmount) <= 0}
                    className="mt-2 w-full rounded-full bg-[#0e6b3f] disabled:bg-[#0e6b3f]/40 text-white py-3.5 font-black text-sm active:scale-95"
                  >
                    Review withdrawal
                  </button>
                </div>
              )}

              {wdStep === "review" && (
                <div className="space-y-3">
                  <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>Review your withdrawal</p>
                  <div className={`rounded-2xl border p-4 space-y-2 ${isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}>
                    <div className="flex justify-between text-sm">
                      <span className={softText}>Method</span>
                      <span className="font-bold">{wdMethod === "crypto" ? "Crypto wallet" : "Bank transfer"}</span>
                    </div>
                    {wdMethod === "crypto" && wdCrypto && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className={softText}>Coin</span>
                          <span className="font-bold">{wdCrypto.name} ({wdCrypto.symbol})</span>
                        </div>
                        <div className="flex justify-between text-sm gap-2">
                          <span className={softText}>Wallet</span>
                          <span className="font-mono text-[11px] truncate max-w-[60%]">{wdWalletAddress}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={softText}>Network</span>
                          <span className="font-bold">{wdCrypto.network}</span>
                        </div>
                      </>
                    )}
                    {wdMethod === "bank" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className={softText}>Bank</span>
                          <span className="font-bold truncate max-w-[60%]">{wdBank}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={softText}>Account</span>
                          <span className="font-bold">{wdAccountNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={softText}>Name</span>
                          <span className="font-bold truncate max-w-[60%]">{wdAccountName}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-black/5">
                      <span className={softText}>Amount</span>
                      <span className="font-black">
                        {wdMethod === "crypto" ? `$${parseFloat(wdAmount || "0").toFixed(2)}` : `${currency.symbol}${parseFloat(wdAmount || "0").toFixed(2)} ${currency.code}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setWdStep(wdMethod === "crypto" ? "cryptoDetails" : "details")} className={`flex-1 rounded-full py-3 font-bold text-sm border ${isDark ? "border-white/10" : "border-black/10"}`}>Edit</button>
                    <button onClick={submitWithdraw} className="flex-1 rounded-full bg-[#0e6b3f] text-white py-3 font-black text-sm active:scale-95">Confirm</button>
                  </div>
                </div>
              )}

              {wdStep === "processing" && (
                <div className="flex flex-col items-center py-10 gap-3 text-center">
                  <div className="h-14 w-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                  <p className="font-black">Processing withdrawal…</p>
                  <p className={`text-xs ${softText}`}>
                    {wdMethod === "crypto" ? `Sending ${wdCrypto?.symbol}` : `Sending to ${wdBank}`}
                  </p>
                </div>
              )}

              {wdStep === "success" && (
                <div className="flex flex-col items-center py-8 gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500 grid place-items-center text-white">
                    <Check className="h-8 w-8" />
                  </div>
                  <p className="font-black text-lg">Withdrawal submitted!</p>
                  <p className={`text-xs ${softText}`}>
                    {wdMethod === "crypto" ? `${wdCrypto?.symbol} · ${wdWalletAddress.slice(0, 8)}…${wdWalletAddress.slice(-4)}` : `${wdBank} · ${wdAccountNumber}`}
                  </p>
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">Pending admin review</span>
                  <p className={`text-xs ${softText}`}>Your request is queued for review. You'll be notified once it's approved or rejected.</p>
                  <button onClick={closeWithdraw} className="mt-3 w-full rounded-full bg-[#0e6b3f] text-white py-3.5 font-black text-sm">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {congrats && (
        <div className="fixed inset-0 z-[80] bg-gradient-to-br from-[#0e6b3f]/95 to-[#0a4a2c]/95 backdrop-blur-md flex items-center justify-center p-6 overflow-hidden">
          {/* Confetti */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 60 }).map((_, i) => {
              const colors = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb7185"];
              const left = Math.random() * 100;
              const delay = Math.random() * 0.8;
              const duration = 2.2 + Math.random() * 2;
              const size = 6 + Math.random() * 8;
              const bg = colors[i % colors.length];
              const rot = Math.random() * 360;
              return (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    top: "-20px",
                    width: size,
                    height: size * 0.4,
                    background: bg,
                    transform: `rotate(${rot}deg)`,
                    animation: `fc-fall ${duration}s ${delay}s linear infinite`,
                    borderRadius: 2,
                  }}
                />
              );
            })}
          </div>
          <style>{`@keyframes fc-fall{to{transform:translateY(110vh) rotate(720deg);opacity:.4}}@keyframes fc-pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}`}</style>

          <div className="relative w-full max-w-[380px] bg-white rounded-3xl p-7 text-center shadow-2xl" style={{ animation: "fc-pop .5s ease-out both" }}>
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 grid place-items-center text-white shadow-lg">
              <Check className="h-10 w-10" strokeWidth={3} />
            </div>
            <p className="mt-5 text-2xl font-black text-[#0b1e1a]">🎉 Congratulations!</p>
            <p className="mt-2 text-sm text-[#0b1e1a]/70">{congrats.body}</p>
            <button
              onClick={() => { setCongrats(null); setOpenCategory(null); setOpenPayment(false); setOpenPremium(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[#0e6b3f] to-[#0a4a2c] text-white py-3.5 font-black text-sm shadow-lg active:scale-95"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}





      {openCategory && (
        <CategoryModal
          categoryKey={openCategory}
          onClose={() => setOpenCategory(null)}
          isDark={isDark}
          softText={softText}
          transactions={transactions}
          downloadReceipt={downloadReceipt}
          fmt={fmt}
          balanceUsd={balanceUsd}
          bonusClaimed={bonusClaimed}
          userEmail={userEmail}
          activePlan={activePlan}
          currentPlan={currentPlan}
          currencyCode={currency.code}
          settings={settings}

        />
      )}

      {openProfile && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className={`flex-1 overflow-y-auto ${isDark ? "bg-[#0a1410] text-white" : "bg-[#e8f5ec] text-[#0b1e1a]"}`}>
            <div className="bg-gradient-to-b from-[#0f7a47] to-[#0a5a34] text-white px-5 pt-10 pb-8 rounded-b-[28px] relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
              <div className="flex items-center justify-between relative">
                <p className="font-black text-lg">My Profile</p>
                <button onClick={() => setOpenProfile(false)} className="h-10 w-10 grid place-items-center rounded-full bg-white/15 backdrop-blur">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-8 flex flex-col items-center relative">
                <div className="h-24 w-24 rounded-full bg-white/20 grid place-items-center text-3xl font-black border-4 border-white/30 overflow-hidden">
                  {userProfile.avatar_url ? (
                    <img src={userProfile.avatar_url} alt={userProfile.name || "avatar"} className="h-full w-full object-cover" />
                  ) : (
                    (userProfile.name || userProfile.username || userProfile.email || "F")[0].toUpperCase()
                  )}
                </div>
                <p className="mt-4 text-xl font-black">{userProfile.name || userProfile.username || "FastCredit user"}</p>
                {userProfile.username && (
                  <p className="text-sm opacity-80">@{userProfile.username}</p>
                )}
                <p className="text-xs opacity-70">{userProfile.country || "—"}</p>
              </div>
            </div>

            <div className="mx-4 mt-4 space-y-3 pb-8">
              <div className={`rounded-3xl p-5 shadow-sm ${card}`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>Profile details</p>
                <div className="mt-4 space-y-4">
                  <ProfileRow icon={<User className="h-4 w-4" />} label="Full name" value={userProfile.name || "—"} softText={softText} />
                  <ProfileRow icon={<UserCircle className="h-4 w-4" />} label="Username" value={userProfile.username ? `@${userProfile.username}` : "—"} softText={softText} />
                  <ProfileRow icon={<Mail className="h-4 w-4" />} label="Email address" value={userProfile.email || "—"} softText={softText} />
                  <ProfileRow icon={<Smartphone className="h-4 w-4" />} label="Phone number" value={userProfile.phone || "—"} softText={softText} />
                  <ProfileRow icon={<Globe className="h-4 w-4" />} label="Country" value={userProfile.country || "—"} softText={softText} />
                  <ProfileRow icon={<Wallet className="h-4 w-4" />} label="Wallet balance" value={fmt(balanceUsd, 2)} softText={softText} />
                  <ProfileRow icon={<Crown className="h-4 w-4" />} label="Current plan" value={activePlan ? `Premium ${PREMIUM_PLANS[activePlan.index].name} (${planActive ? "Active" : "Expired"})` : "No active plan"} softText={softText} />
                  <ProfileRow icon={<CreditCard className="h-4 w-4" />} label="Preferred currency" value={`${currency.code} (${currency.symbol.trim()})`} softText={softText} />
                  <ProfileRow icon={<Calendar className="h-4 w-4" />} label="Date joined" value={userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"} softText={softText} />
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full grid place-items-center ${isDark ? "bg-white/10" : "bg-black/5"}`}>
                      <Gift className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] ${softText}`}>Referral code</p>
                      <p className="font-black tracking-wide">{userProfile.referral_code || "—"}</p>
                    </div>
                    {userProfile.referral_code && (
                      <button
                        onClick={() => copyText(userProfile.referral_code, "ref")}
                        className="inline-flex items-center gap-1 rounded-full bg-[#0e6b3f] text-white px-3 py-1.5 text-[11px] font-bold active:scale-95"
                      >
                        {copied === "ref" ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={`rounded-3xl p-5 shadow-sm ${card}`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>Account status</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Verified member</p>
                    <p className={`text-[11px] ${softText}`}>
                      {userProfile.created_at ? `Joined ${new Date(userProfile.created_at).toLocaleDateString()}` : "Account active"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-3xl p-4 font-bold text-sm bg-red-500/10 text-red-600 hover:bg-red-500/15 active:scale-[.98] transition"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type CategoryModalProps = {
  categoryKey: string;
  onClose: () => void;
  isDark: boolean;
  softText: string;
  transactions: Txn[];
  downloadReceipt: (t: Txn) => void;
  fmt: (usd: number, decimals?: number) => string;
  balanceUsd: number;
  bonusClaimed: boolean;
  userEmail: string;
  activePlan: { index: number; startedAt: number } | null;
  currentPlan: typeof PREMIUM_PLANS[number] | null;
  currencyCode: string;
  settings: import("@/lib/site-settings").SiteSettings;
};

function CategoryModal(props: CategoryModalProps) {
  const { categoryKey, onClose, isDark, softText, transactions, downloadReceipt, fmt, balanceUsd, bonusClaimed, userEmail, activePlan, currentPlan, currencyCode, settings } = props;
  const title =
    categoryKey === "savings" ? "Savings · Transactions" :
    categoryKey === "history" ? "History & Receipts" :
    categoryKey === "community" ? "Community" :
    categoryKey === "donation" ? "Rewards" :
    categoryKey === "support" ? "Support" :
    categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);


  const cardBg = isDark ? "bg-[#111f19] text-white" : "bg-white text-[#0b1e1a]";
  const rowBg = isDark ? "bg-white/5 border-white/10" : "bg-white border-black/5";

  const renderTxn = (t: Txn, showDownload: boolean) => {
    const badge =
      t.status === "approved" ? { bg: "bg-emerald-500", label: "Approved", icon: <Check className="h-3 w-3" /> } :
      t.status === "credited" ? { bg: "bg-sky-500", label: "Credited", icon: <TrendingUp className="h-3 w-3" /> } :
      { bg: "bg-red-500", label: "Declined", icon: <XCircle className="h-3 w-3" /> };
    return (
      <div key={t.id} className={`rounded-2xl border p-3 ${rowBg}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-extrabold capitalize truncate">{t.kind}</p>
              <span className={`inline-flex items-center gap-1 rounded-full ${badge.bg} text-white px-2 py-0.5 text-[10px] font-bold`}>{badge.icon}{badge.label}</span>
            </div>
            <p className={`text-[11px] ${softText} truncate`}>{t.method || t.note || "—"}</p>
            <p className={`text-[10px] ${softText}`}>{new Date(t.at).toLocaleString()}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-black ${t.status === "declined" ? "text-red-500 line-through" : "text-emerald-600"}`}>{fmt(t.amountUsd, 2)}</p>
            {showDownload && (
              <button onClick={() => downloadReceipt(t)} className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#0e6b3f] text-white px-2.5 py-1 text-[10px] font-bold">
                <Download className="h-3 w-3" /> Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={`w-full max-w-[440px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl ${cardBg} shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-black/5 bg-gradient-to-r from-[#0e6b3f] to-[#0a4a2c] text-white rounded-t-3xl">
          <p className="font-black text-base">{title}</p>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full bg-black/20"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5">
          {categoryKey === "savings" && (
            <div className="space-y-3">
              <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                <p className="text-[11px] uppercase opacity-80">Total balance</p>
                <p className="text-3xl font-extrabold">{fmt(balanceUsd, 2)}</p>
              </div>
              <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>All transactions</p>
              {transactions.length === 0 && <p className={`text-xs ${softText}`}>No transactions yet.</p>}
              {transactions.map(t => renderTxn(t, false))}
            </div>
          )}

          {categoryKey === "history" && (
            <div className="space-y-3">
              <p className={`text-[11px] ${softText}`}>Download receipts for deposits, withdrawals and declined payments.</p>
              {transactions.length === 0 && <p className={`text-xs ${softText}`}>No history yet.</p>}
              {transactions.map(t => renderTxn(t, true))}
            </div>
          )}

          {categoryKey === "community" && (
            <div className="space-y-3">
              <p className={`text-[11px] ${softText}`}>Join our official channels — updates, announcements and community chat.</p>
              {settings.community.length === 0 && (
                <div className={`rounded-2xl border p-6 text-center ${rowBg}`}>
                  <MessageCircle className="h-8 w-8 mx-auto text-emerald-500" />
                  <p className={`text-xs mt-2 ${softText}`}>No community links yet. Check back soon.</p>
                </div>
              )}
              {settings.community.map((c) => {
                const Icon = c.platform === "telegram" ? Send : c.platform === "whatsapp" ? MessageCircle : ExternalLink;
                return (
                  <a key={c.id} href={c.url} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-3 rounded-2xl border p-4 ${rowBg} active:scale-[.98] transition`}>
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white grid place-items-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black truncate">{c.title}</p>
                      <p className={`text-[11px] ${softText} truncate`}>{c.platform} · {c.url}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 opacity-60" />
                  </a>
                );
              })}
            </div>
          )}

          {categoryKey === "donation" && (
            <div className="space-y-3">
              <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-400 to-amber-600 text-[#3a2500]">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <p className="font-black">Rewards</p>
                </div>
                <p className="mt-2 text-3xl font-extrabold">{fmt(2 * (bonusClaimed ? 1 : 0) + transactions.filter(t => t.kind === "mining").reduce((s, t) => s + t.amountUsd, 0), 2)}</p>
                <p className="text-[11px] font-semibold opacity-80">Total rewards earned</p>
              </div>
              <div className={`rounded-2xl border p-4 space-y-3 ${rowBg}`}>
                <ProfileRow icon={<Sparkles className="h-4 w-4" />} label="Welcome bonus" value={bonusClaimed ? "Claimed · $2" : "Available"} softText={softText} />
                <ProfileRow icon={<Pickaxe className="h-4 w-4" />} label="Mining claims" value={String(transactions.filter(t => t.kind === "mining").length)} softText={softText} />
                <ProfileRow icon={<Zap className="h-4 w-4" />} label="Next reward" value={currentPlan ? fmt(currentPlan.mineReward, 2) : "Activate a plan"} softText={softText} />
                <ProfileRow icon={<Gift className="h-4 w-4" />} label="Referral bonus" value="Invite friends · earn $5 each" softText={softText} />
              </div>
            </div>
          )}

          {categoryKey === "support" && (
            <div className="space-y-3">
              <p className={`text-[11px] ${softText}`}>We're here 24/7 — reach us on any of these channels.</p>
              {settings.support.length === 0 && (
                <div className={`rounded-2xl border p-6 text-center ${rowBg}`}>
                  <LifeBuoy className="h-8 w-8 mx-auto text-emerald-500" />
                  <p className={`text-xs mt-2 ${softText}`}>No support contacts configured yet.</p>
                </div>
              )}
              {settings.support.map((s) => {
                const Icon = s.kind === "telegram" ? Send
                  : s.kind === "whatsapp" ? MessageCircle
                  : s.kind === "email" ? Mail
                  : s.kind === "phone" ? Phone
                  : ExternalLink;
                return (
                  <a key={s.id} href={supportHref(s)} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-3 rounded-2xl border p-4 ${rowBg} active:scale-[.98] transition`}>
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white grid place-items-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black truncate">{s.label}</p>
                      <p className={`text-[11px] ${softText} truncate`}>{s.value}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 opacity-60" />
                  </a>
                );
              })}
            </div>
          )}

          {(categoryKey === "wallet" || categoryKey === "payments" || categoryKey === "journey") && (
            <div className={`rounded-2xl border p-5 text-center ${rowBg}`}>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500 text-white grid place-items-center">
                <Briefcase className="h-6 w-6" />
              </div>
              <p className="mt-3 font-black">{title} coming soon</p>
              <p className={`mt-1 text-[11px] ${softText}`}>This section is being prepared for you.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon, label, value, softText }: { icon: React.ReactNode; label: string; value: string; softText: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] uppercase tracking-wide ${softText}`}>{label}</p>
        <p className="font-bold text-sm break-all">{value}</p>
      </div>
    </div>
  );
}

function ReceiptUpload({ receiptFile, setReceiptFile, isDark, softText }: { receiptFile: File | null; setReceiptFile: (f: File | null) => void; isDark: boolean; softText: string; }) {
  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${softText}`}>Upload payment receipt</p>
      <label className={`mt-2 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 cursor-pointer ${isDark ? "border-white/15 bg-white/5" : "border-emerald-400/50 bg-emerald-50/40"}`}>
        <div className="h-10 w-10 rounded-full bg-emerald-500 text-white grid place-items-center">
          <Upload className="h-4 w-4" />
        </div>
        {receiptFile ? (
          <>
            <p className="text-xs font-bold text-emerald-600 break-all text-center">{receiptFile.name}</p>
            <p className={`text-[10px] ${softText}`}>Tap to replace</p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold">Tap to upload receipt</p>
            <p className={`text-[10px] ${softText}`}>PNG, JPG or PDF · max 5MB</p>
          </>
        )}
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
