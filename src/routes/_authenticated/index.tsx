import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Moon, Sun, Bell, ChevronDown, ArrowDownLeft, ArrowUpRight, Crown,
  Briefcase, Receipt, Route as RouteIcon, Users,
  Gift, PiggyBank, Heart, Home, Search, Wallet, User, X, Check,
  Sparkles, Pickaxe, Zap, Pause, Copy, Upload, LifeBuoy, Clock,
  Award, UserCircle, Download, TrendingUp, XCircle, Mail, Calendar,
  Globe, Smartphone, CreditCard, MessageCircle, Send, Phone, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, supportHref } from "@/lib/site-settings";


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
  email: string;
  phone: string;
  country: string;
};

const DEFAULT_PROFILE: UserProfile = { name: "", email: "", phone: "", country: "Nigeria" };

function Root() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [userProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("dashboard"), 2000);
      return () => clearTimeout(t);
    }
  }, [screen]);
  if (screen === "splash") return <Splash />;
  return <Dashboard userProfile={userProfile} />;
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

// Premium plan tiers. mineReward = USD credited per mining tap (2 taps / day).
const PREMIUM_PLANS = (() => {
  const base = [
    { name: "Starter", invest: 12,   mineReward: 17 },
    { name: "Plan 2",  invest: 25,   mineReward: 35 },
    { name: "Plan 3",  invest: 50,   mineReward: 70 },
    { name: "Plan 4",  invest: 100,  mineReward: 150 },
    { name: "Plan 5",  invest: 250,  mineReward: 380 },
    { name: "Plan 6",  invest: 500,  mineReward: 800 },
    { name: "Plan 7",  invest: 600,  mineReward: 1200 },
    { name: "Plan 8",  invest: 1500, mineReward: 1760 },
  ];
  // 2 taps/day × 14 days = 28 total taps
  return base.map(p => {
    const total = p.mineReward * 28;
    return { ...p, profit: p.mineReward * 2, total, returned: p.invest + total };
  });
})();

const PAYMENT_METHODS = [
  { id: "crypto", label: "Pay with Crypto", desc: "BTC, USDT, ETH — instant confirm", emoji: "₿" },
  { id: "ngn", label: "Pay with NGN", desc: "Bank transfer · Naira", emoji: "🇳🇬" },
  { id: "card", label: "Add your Card", desc: "Visa, Mastercard, Verve", emoji: "💳" },
];

// Country → bank lists for Withdraw flow. Keyed by currency code so the currency
// switcher and profile country selectors line up automatically.
const BANKS_BY_CURRENCY: Record<string, { country: string; flag: string; banks: string[] }> = {
  NGN: {
    country: "Nigeria", flag: "🇳🇬",
    banks: [
      "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank",
      "First Bank of Nigeria", "First City Monument Bank (FCMB)", "Globus Bank",
      "Guaranty Trust Bank (GTBank)", "Heritage Bank", "Jaiz Bank", "Keystone Bank",
      "Kuda Bank", "Lotus Bank", "Opay", "Palmpay", "Parallex Bank", "Polaris Bank",
      "Premium Trust Bank", "Providus Bank", "Rand Merchant Bank", "Signature Bank",
      "Stanbic IBTC Bank", "Standard Chartered Nigeria", "Sterling Bank",
      "SunTrust Bank", "TAJ Bank", "Titan Trust Bank", "Union Bank of Nigeria",
      "United Bank for Africa (UBA)", "Unity Bank", "VFD Bank", "Wema Bank",
      "Zenith Bank", "Coronation Merchant Bank", "Nova Merchant Bank",
    ],
  },
  CFA: {
    country: "Cameroon", flag: "🇨🇲",
    banks: [
      "Afriland First Bank", "BICEC", "Commercial Bank of Cameroon (CBC)",
      "Ecobank Cameroun", "Standard Chartered Bank Cameroon",
      "Société Générale Cameroun (SGC)", "UBA Cameroun", "BGFI Bank Cameroun",
      "Citibank Cameroon", "Access Bank Cameroon", "Attijariwafa Bank (SCB)",
      "CCA Bank", "La Régionale", "Union Bank of Cameroon",
      "National Financial Credit Bank (NFC)",
    ],
  },
  ZAR: {
    country: "South Africa", flag: "🇿🇦",
    banks: [
      "Standard Bank", "ABSA Bank", "First National Bank (FNB)", "Nedbank",
      "Capitec Bank", "Investec", "African Bank", "Discovery Bank",
      "TymeBank", "Bidvest Bank",
    ],
  },
  GHS: {
    country: "Ghana", flag: "🇬🇭",
    banks: [
      "Ghana Commercial Bank (GCB)", "Ecobank Ghana", "Absa Bank Ghana",
      "Standard Chartered Ghana", "Zenith Bank Ghana", "Fidelity Bank Ghana",
      "CalBank", "Access Bank Ghana", "Stanbic Bank Ghana",
      "Republic Bank Ghana", "UBA Ghana", "Consolidated Bank Ghana",
      "ADB Bank", "Prudential Bank",
    ],
  },
  USD: {
    country: "United States", flag: "🇺🇸",
    banks: [
      "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citibank",
      "U.S. Bank", "PNC Bank", "Truist Bank", "Goldman Sachs Bank",
      "Capital One", "TD Bank",
    ],
  },
  GBP: {
    country: "United Kingdom", flag: "🇬🇧",
    banks: [
      "Barclays", "HSBC UK", "Lloyds Bank", "NatWest", "Santander UK",
      "Standard Chartered UK", "Nationwide", "Metro Bank", "Monzo",
      "Starling Bank", "Revolut",
    ],
  },
  EUR: {
    country: "Eurozone", flag: "🇪🇺",
    banks: [
      "Deutsche Bank", "BNP Paribas", "Société Générale", "ING Bank",
      "Santander", "UniCredit", "Rabobank", "Commerzbank", "KBC Bank",
      "Intesa Sanpaolo", "Crédit Agricole", "ABN AMRO",
    ],
  },
};

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
const PLAN_DURATION = 14 * DAY;
const MIN_WITHDRAW_USD = 100;

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
  const userEmail = userProfile.email;
  const settings = useSiteSettings();
  const [currency, setCurrency] = useState(CURRENCIES[0]);
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
  const [toast, setToast] = useState<string | null>(null);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [wdStep, setWdStep] = useState<"method" | "country" | "bank" | "details" | "crypto" | "cryptoDetails" | "review" | "processing" | "success">("method");
  const [wdMethod, setWdMethod] = useState<"bank" | "crypto" | null>(null);
  const [wdCurrencyKey, setWdCurrencyKey] = useState<string>("NGN");
  const [wdBank, setWdBank] = useState<string>("");
  const [wdAccountNumber, setWdAccountNumber] = useState("");
  const [wdAccountName, setWdAccountName] = useState("");
  const [wdAmount, setWdAmount] = useState("");
  const [wdCrypto, setWdCrypto] = useState<typeof CRYPTOCURRENCIES[number] | null>(null);
  const [wdCryptoSearch, setWdCryptoSearch] = useState("");
  const [wdWalletAddress, setWdWalletAddress] = useState("");
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [congrats, setCongrats] = useState<null | { title: string; body: string }>(null);

  const addTxn = (t: Omit<Txn, "id" | "at">) =>
    setTransactions(prev => [{ ...t, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now() }, ...prev]);

  // Load wallet balance + payments from DB; subscribe to realtime updates
  useEffect(() => {
    let cancelled = false;
    async function loadUserState() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || cancelled) return;
      const uid = u.user.id;
      const { data: bal } = await supabase.from("wallet_balances").select("balance_usd").eq("user_id", uid).maybeSingle();
      if (!cancelled && bal) setBalanceUsd(Number(bal.balance_usd));
      const { data: pays } = await supabase.from("payments").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(30);
      if (!cancelled && pays) {
        setTransactions(pays.map((p) => ({
          id: p.id,
          kind: p.status === "rejected" ? "declined" as const : "deposit" as const,
          amountUsd: Number(p.amount),
          method: p.method ?? undefined,
          status: p.status === "approved" ? "approved" as const : p.status === "rejected" ? "declined" as const : "pending" as const,
          at: new Date(p.created_at).getTime(),
          note: p.rejection_reason || (p.status === "approved" ? "Deposit approved" : p.status === "pending" ? "Awaiting confirmation" : undefined),
        })));
        // Determine active mining plan from most recent approved payment with a plan_index
        const planPay = pays.find((p) => p.status === "approved" && p.plan_index != null);
        if (planPay) {
          const startedAt = new Date(planPay.created_at).getTime();
          if (Date.now() - startedAt < PLAN_DURATION) {
            setActivePlan({ index: planPay.plan_index as number, startedAt });
          } else {
            setActivePlan(null);
          }
        } else {
          setActivePlan(null);
        }
      }
      // Load mining claims from last 24h
      const since = new Date(Date.now() - DAY).toISOString();
      const { data: claims } = await supabase.from("mining_claims").select("created_at").eq("user_id", uid).gte("created_at", since);
      if (!cancelled) setRecentMines((claims ?? []).map((c) => new Date(c.created_at).getTime()));
      // Subscribe: balance + notifications for toast
      const ch = supabase.channel(`user-${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "wallet_balances", filter: `user_id=eq.${uid}` },
          (payload) => { const n = payload.new as { balance_usd?: number } | null; if (n?.balance_usd != null) setBalanceUsd(Number(n.balance_usd)); })
        .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${uid}` }, loadUserState)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          (payload) => {
            const n = payload.new as { title?: string; body?: string; kind?: string } | null;
            if (!n?.title) return;
            const isApproval = /approved/i.test(n.title) || n.title.includes("🎉");
            if (isApproval) {
              setCongrats({ title: n.title, body: n.body || "Your payment has been approved successfully." });
            } else {
              const msg = `${n.title}${n.body ? ": " + n.body : ""}`;
              setToast(msg); setTimeout(() => setToast((t) => t === msg ? null : t), 4500);
            }
          })
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
    loadUserState();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);


  const planExpiresAt = activePlan ? activePlan.startedAt + PLAN_DURATION : 0;
  const planActive = activePlan !== null && now < planExpiresAt;
  const minesInWindow = recentMines.filter(t => now - t < DAY);
  const minesUsedToday = minesInWindow.length;
  const nextMineAt = minesUsedToday >= MAX_DAILY_MINES && minesInWindow.length ? Math.min(...minesInWindow) + DAY : 0;
  const mineReady = planActive && minesUsedToday < MAX_DAILY_MINES;
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
    addTxn({ kind: "bonus", amountUsd: 2, status: "credited", note: "Welcome bonus" });
  };

  const mine = async () => {
    if (!mineReady || !currentPlan || !activePlan) return;
    const reward = currentPlan.mineReward;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const uid = u.user.id;
    // Insert claim
    const { error: cErr } = await supabase.from("mining_claims").insert({
      user_id: uid, amount_usd: reward, plan_index: activePlan.index,
    });
    if (cErr) { showToast("Could not record mining claim"); return; }
    // Update wallet_balances
    const { data: existing } = await supabase.from("wallet_balances").select("balance_usd").eq("user_id", uid).maybeSingle();
    const next = Number(existing?.balance_usd ?? 0) + reward;
    if (existing) await supabase.from("wallet_balances").update({ balance_usd: next }).eq("user_id", uid);
    else await supabase.from("wallet_balances").insert({ user_id: uid, balance_usd: next });
    setBalanceUsd(next);
    setRecentMines(prev => [...prev, Date.now()]);
    addTxn({ kind: "mining", amountUsd: reward, status: "credited", note: `Mining reward · Plan ${activePlan.index + 1}` });
  };

  const activatePlan = () => {
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



  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(t => (t === msg ? null : t)), 2200);
  };

  const downloadReceipt = (t: Txn) => {
    try {
      const lines = [
        "===== FASTCREDIT RECEIPT =====",
        `Receipt ID: ${t.id}`,
        `Type: ${t.kind.toUpperCase()}`,
        `Status: ${t.status.toUpperCase()}`,
        `Amount: ${fmt(t.amountUsd, 2)} (≈ $${t.amountUsd.toFixed(2)} USD)`,
        t.method ? `Method: ${t.method}` : "",
        t.note ? `Note: ${t.note}` : "",
        `Date: ${new Date(t.at).toLocaleString()}`,
        `Account: ${userEmail || "user@fastcredit.app"}`,
        "==============================",
        "Thank you for using FastCredit.",
      ].filter(Boolean).join("\n");
      const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const filename = `fastcredit-${t.kind}-${t.id}.txt`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // iOS Safari fallback: open in a new tab so the user can save it.
      const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
      if (isIOS) window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast(`Receipt downloaded · ${filename}`);
    } catch {
      showToast("Could not download receipt");
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
      showToast(`Minimum withdrawal amount is $${MIN_WITHDRAW_USD}. Please continue mining until you reach the minimum withdrawal limit.`);
      return;
    }
    const preselect = BANKS_BY_CURRENCY[currency.code] ? currency.code : "NGN";
    setWdMethod(null);
    setWdCurrencyKey(preselect);
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
    const bankInfo = BANKS_BY_CURRENCY[wdCurrencyKey];
    setTimeout(() => {
      const method = wdMethod === "crypto"
        ? `${wdCrypto?.name} (${wdCrypto?.symbol}) · ${wdCrypto?.network}`
        : `${bankInfo?.country} · ${wdBank}`;
      const note = wdMethod === "crypto"
        ? `To wallet ${wdWalletAddress.slice(0, 10)}…${wdWalletAddress.slice(-6)}`
        : `To ${wdAccountName || "account"} · ${wdAccountNumber}`;
      if (balanceUsd >= amtUsd && amtUsd > 0) {
        setBalanceUsd(b => b - amtUsd);
        addTxn({ kind: "withdraw", amountUsd: amtUsd, status: "approved", method, note });
      } else {
        addTxn({ kind: "declined", amountUsd: amtUsd, status: "declined", method, note: "Insufficient balance for withdrawal" });
      }
      setWdStep("success");
    }, 2200);
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
            <button onClick={() => setOpenProfile(true)} className="flex items-center gap-3 text-left active:scale-95 transition">
              <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center font-black">{(userProfile.name || userProfile.email || "F")[0].toUpperCase()}</div>
              <div>
                <p className="text-[11px] opacity-80">Good morning!</p>
                <p className="font-bold leading-tight">{userProfile.name || "Ryan Sterling"}</p>
              </div>
            </button>
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
            <button onClick={openWithdrawFlow} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white text-[#0e6b3f] py-3 text-sm font-bold shadow-lg active:scale-95">
              <ArrowUpRight className="h-4 w-4" /> Withdraw
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
            {CATEGORIES.map(({ icon: Icon, label, key }) => (
              <button key={label} onClick={() => setOpenCategory(key)} className="flex flex-col items-center gap-2 active:scale-95 transition">
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
                    <Zap className="h-3 w-3" /> {currentPlan ? fmt(currentPlan.mineReward, 2) : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] opacity-80 relative">Next mine reward</p>
              <p className="mt-0.5 text-3xl font-extrabold tracking-tight relative">
                {currentPlan ? fmt(currentPlan.mineReward, 2) : fmt(0, 2)}
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
                  <><Pickaxe className="h-4 w-4" /> Mine {currentPlan ? fmt(currentPlan.mineReward, 2) : ""}</>
                ) : (
                  <><Pause className="h-4 w-4" /> Cooldown {formatCountdown(nextMineAt - now)}</>
                )}
              </button>
              <p className={`mt-2 text-center text-[10px] ${softText}`}>
                Mine up to {MAX_DAILY_MINES}× per day · Higher plan = higher reward · {MAX_DAILY_MINES - minesUsedToday} left today
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
                <p className="mt-1 text-3xl font-extrabold text-amber-600">{fmt(12, currency.code === "USD" || currency.code === "EUR" || currency.code === "GBP" ? 2 : 0)}</p>
                <p className={`mt-1 text-[11px] ${softText}`}>≈ $12 USD · Shown in {currency.code}</p>
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
                            <p className="font-extrabold">{p.name} · {fmt(p.invest, dec)}</p>
                            <p className={`text-[10px] ${active ? "text-[#0b1e1a]/60" : softText}`}>Deposit</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-emerald-600">{fmt(p.mineReward, 2)}</p>
                          <p className={`text-[10px] ${active ? "text-[#0b1e1a]/60" : softText}`}>per mining tap</p>
                        </div>
                      </div>
                      <div className={`mt-3 grid grid-cols-2 gap-2 text-[11px] ${active ? "text-[#0b1e1a]/80" : softText}`}>
                        <div className={`rounded-lg px-2 py-1.5 ${active ? "bg-white" : isDark ? "bg-white/5" : "bg-[#f6f8f7]"}`}>
                          <p className="opacity-70">Per day (2 taps)</p>
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

              <button onClick={activatePlan} className="mt-4 w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[#3a2500] py-3.5 font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95">
                <Crown className="h-4 w-4" /> Activate for {fmt(PREMIUM_PLANS[selectedPlan].invest, ["USD","EUR","GBP"].includes(currency.code) ? 2 : 0)}
              </button>
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
                  {wdMethod === "bank" && wdStep !== "method" && wdStep !== "country" && BANKS_BY_CURRENCY[wdCurrencyKey] && (
                    <span className="ml-2 text-xs opacity-80">· {BANKS_BY_CURRENCY[wdCurrencyKey].flag} {BANKS_BY_CURRENCY[wdCurrencyKey].country}</span>
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
                  <p className={`text-[11px] ${softText}`}>We'll show the banks supported in your country for withdrawal.</p>
                  <div className="mt-3 space-y-2">
                    {Object.entries(BANKS_BY_CURRENCY).map(([key, info]) => {
                      const isActive = wdCurrencyKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => { setWdCurrencyKey(key); setWdBank(""); setWdStep("bank"); }}
                          className={`w-full flex items-center justify-between rounded-2xl border p-3 text-left active:scale-[0.98] transition ${isActive ? "border-[#0e6b3f] bg-emerald-50" : isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl shrink-0">{info.flag}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{info.country}</p>
                              <p className={`text-[11px] ${softText}`}>{info.banks.length} banks · {key}</p>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 opacity-60 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {wdStep === "bank" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>Select your bank</p>
                    <button onClick={() => setWdStep("country")} className="text-[11px] font-bold text-[#0e6b3f]">Change country</button>
                  </div>
                  <div className="mt-2 space-y-1.5 pr-1">
                    {BANKS_BY_CURRENCY[wdCurrencyKey]?.banks.map(b => {
                      const isActive = wdBank === b;
                      return (
                        <button
                          key={b}
                          onClick={() => { setWdBank(b); setWdStep("details"); }}
                          className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left ${isActive ? "border-[#0e6b3f] bg-emerald-50" : isDark ? "border-white/10 bg-white/5" : "border-black/5 bg-white"}`}
                        >
                          <span className="font-semibold text-sm truncate">{b}</span>
                          <ChevronDown className="h-4 w-4 -rotate-90 opacity-50 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {wdStep === "details" && (
                <div className="space-y-3">
                  <div className={`rounded-2xl p-3 ${isDark ? "bg-white/5" : "bg-emerald-50"} flex items-center justify-between gap-2`}>
                    <div className="min-w-0">
                      <p className={`text-[10px] uppercase font-bold ${softText}`}>Selected bank</p>
                      <p className="font-black text-sm truncate">{wdBank}</p>
                      <p className={`text-[10px] ${softText}`}>{BANKS_BY_CURRENCY[wdCurrencyKey]?.flag} {BANKS_BY_CURRENCY[wdCurrencyKey]?.country}</p>
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
                    <span className={`mt-1 block text-[10px] ${softText}`}>Available: {fmt(balanceUsd, 2)}</span>
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
                    <span className={`mt-1 block text-[10px] ${softText}`}>Available: ${balanceUsd.toFixed(2)}</span>
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
                  <p className={`text-xs ${softText}`}>You can download a receipt from History.</p>
                  <button onClick={closeWithdraw} className="mt-3 w-full rounded-full bg-[#0e6b3f] text-white py-3.5 font-black text-sm">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] rounded-full bg-black/85 text-white text-xs font-semibold px-4 py-2 shadow-2xl backdrop-blur">
          {toast}
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
                <div className="h-24 w-24 rounded-full bg-white/20 grid place-items-center text-3xl font-black border-4 border-white/30">
                  {(userProfile.name || userProfile.email || "F")[0].toUpperCase()}
                </div>
                <p className="mt-4 text-xl font-black">{userProfile.name || "Ryan Sterling"}</p>
                <p className="text-sm opacity-80">{userProfile.country}</p>
              </div>
            </div>

            <div className="mx-4 mt-4 space-y-3 pb-8">
              <div className={`rounded-3xl p-5 shadow-sm ${card}`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${softText}`}>Profile details</p>
                <div className="mt-4 space-y-4">
                  <ProfileRow icon={<User className="h-4 w-4" />} label="Full name" value={userProfile.name || "—"} softText={softText} />
                  <ProfileRow icon={<Mail className="h-4 w-4" />} label="Email address" value={userProfile.email || "—"} softText={softText} />
                  <ProfileRow icon={<Smartphone className="h-4 w-4" />} label="Phone number" value={userProfile.phone || "—"} softText={softText} />
                  <ProfileRow icon={<Globe className="h-4 w-4" />} label="Country" value={userProfile.country || "—"} softText={softText} />
                  <ProfileRow icon={<Wallet className="h-4 w-4" />} label="Wallet balance" value={fmt(balanceUsd, 2)} softText={softText} />
                  <ProfileRow icon={<Crown className="h-4 w-4" />} label="Active plan" value={activePlan ? `Premium · Plan ${activePlan.index + 1}` : "No active plan"} softText={softText} />
                  <ProfileRow icon={<Calendar className="h-4 w-4" />} label="Preferred currency" value={currency.code} softText={softText} />
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
                    <p className={`text-[11px] ${softText}`}>Account created today</p>
                  </div>
                </div>
              </div>
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
