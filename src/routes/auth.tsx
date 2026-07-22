import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requestOtp, verifyOtp } from "@/lib/otp.functions";
import { User, Phone, Globe, Mail, Lock, Loader2, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · FastCredit" },
      { name: "description", content: "Access your FastCredit premium account." },
    ],
  }),
  component: AuthPage,
});

const COUNTRIES = [
  "Nigeria", "Cameroon", "South Africa", "Ghana", "Kenya", "Egypt",
  "United States", "United Kingdom", "Canada", "Germany", "France",
  "United Arab Emirates", "Saudi Arabia", "India", "China", "Brazil", "Other",
];

type Step = "register" | "creating" | "otp" | "verifying" | "login";

// Premium dark tokens — matches dashboard
const GOLD = "#D4AF37";
const BG = "#0D0D0D";

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("register");
  const [form, setForm] = useState({
    fullName: "", phone: "", country: "", email: "", password: "", confirm: "",
  });
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const requestOtpFn = useServerFn(requestOtp);
  const verifyOtpFn = useServerFn(verifyOtp);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("suspended=1")) {
      setError("Your account has been suspended. Please contact support for assistance.");
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: ban } = await supabase
        .from("user_bans").select("user_id").eq("user_id", data.session.user.id).maybeSingle();
      if (ban) {
        await supabase.auth.signOut();
        setError("Your account has been suspended. Please contact support for assistance.");
        return;
      }
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: data.session.user.id,
        _role: "admin",
      });
      navigate({ to: isAdmin ? "/admin/dashboard" : "/" });
    });
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cooldown]);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate(): string | null {
    if (!form.fullName.trim()) return "Enter your full name.";
    if (!form.phone.trim() || form.phone.trim().length < 6) return "Enter a valid phone number.";
    if (!form.country) return "Select your country.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  }

  async function sendCode(email: string) {
    const res = (await requestOtpFn({ data: { email } })) as { cooldownSeconds?: number };
    setCooldown(res.cooldownSeconds ?? 60);
    setInfo(`We sent a 6-digit code to ${email}. It expires in 5 minutes.`);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null);
    const v = validate();
    if (v) return setError(v);
    if (step === "creating") return;
    setStep("creating");
    const email = form.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          country: form.country,
        },
      },
    });

    if (data?.session) await supabase.auth.signOut();

    const identities = (data?.user as { identities?: unknown[] } | null)?.identities;
    const alreadyRegistered =
      (error && /already|registered|exists/i.test(error.message || "")) ||
      (Array.isArray(identities) && identities.length === 0);

    if (error && !alreadyRegistered) {
      setStep("register");
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("password")) return setError("Please choose a stronger password (at least 8 characters).");
      if (msg.includes("email") && msg.includes("invalid")) return setError("Please enter a valid email address.");
      return setError("We couldn't create your account. Please try again.");
    }

    setMode(alreadyRegistered ? "login" : "signup");
    try {
      await sendCode(email);
      setStep("otp");
    } catch (err) {
      setStep("register");
      setError((err as Error).message || "Could not send verification code.");
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null);
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (!form.password) return setError("Enter your password.");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: form.password });
    if (error || !data.session) {
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("invalid")) return setError("Invalid email or password.");
      return setError(error?.message || "Login failed.");
    }
    const { data: ban } = await supabase
      .from("user_bans").select("user_id").eq("user_id", data.user.id).maybeSingle();
    await supabase.auth.signOut();
    if (ban) return setError("Your account has been suspended. Please contact support for assistance.");

    setMode("login");
    try {
      await sendCode(email);
      setToken("");
      setStep("otp");
    } catch (err) {
      setError((err as Error).message || "Could not send verification code.");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (token.trim().length < 6) return setError("Enter the 6-digit code.");
    const email = form.email.trim().toLowerCase();

    try {
      await verifyOtpFn({ data: { email, code: token.trim() } });
    } catch (err) {
      return setError((err as Error).message || "Verification failed. Please try again.");
    }

    const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
      email, password: form.password,
    });
    if (signInErr || !signIn.session) {
      return setError("Could not sign you in. Please try logging in again.");
    }

    if (mode === "signup") {
      await supabase.from("profiles").upsert({
        id: signIn.user.id,
        email,
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        country: form.country,
      }, { onConflict: "id" });
    }

    setStep("verifying");
    await new Promise((r) => setTimeout(r, 1500));
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: signIn.user.id,
      _role: "admin",
    });
    navigate({ to: isAdmin ? "/admin/dashboard" : "/" });
  }

  async function resend() {
    if (cooldown > 0) return;
    setError(null); setInfo(null);
    try {
      await sendCode(form.email.trim().toLowerCase());
    } catch (err) {
      setError((err as Error).message || "Could not resend code.");
    }
  }

  // ---- Shared premium shell ----
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{ backgroundColor: BG }}
    >
      {/* Ambient gold glow */}
      <div
        className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
      />
      <div className="w-full max-w-sm relative z-10 animate-fade-in">{children}</div>
    </div>
  );

  const BrandMark = ({ subtitle }: { subtitle: string }) => (
    <div className="text-center mb-8">
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${GOLD} 0%, #B8912E 100%)`,
          boxShadow: `0 20px 40px -12px ${GOLD}66`,
        }}
      >
        <Sparkles className="w-8 h-8 text-black" strokeWidth={2.5} />
      </div>
      <h1 className="text-3xl font-black text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
        Fast<span style={{ color: GOLD }}>Credit</span>
      </h1>
      <p className="text-xs text-white/50 mt-2 font-medium">{subtitle}</p>
    </div>
  );

  if (step === "verifying") {
    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center px-5 text-center relative overflow-hidden"
        style={{ backgroundColor: BG }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${GOLD} 0%, transparent 60%)` }}
        />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white tracking-tight">
            Fast<span style={{ color: GOLD }}>Credit</span>
          </h1>
          <Loader2 className="w-10 h-10 animate-spin mt-8 mx-auto" style={{ color: GOLD }} />
          <p className="mt-6 text-white/80 text-sm font-medium max-w-xs">
            Verification successful. Redirecting to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <Shell>
        <BrandMark subtitle="Verify your identity" />
        <div
          className="rounded-3xl p-6 backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-xs text-white/60">
              Code sent to <span className="text-white font-medium">{form.email}</span>
            </span>
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <OtpBoxes value={token} onChange={setToken} />
            {info && <p className="text-xs text-center" style={{ color: GOLD }}>{info}</p>}
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <button type="submit" className={primaryBtn}>Verify & Continue</button>
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => { setStep("register"); setToken(""); setError(null); setInfo(null); }}
                className="text-white/50 hover:text-white/80 inline-flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0}
                className="font-medium disabled:text-white/30 transition"
                style={{ color: cooldown > 0 ? undefined : GOLD }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        </div>
      </Shell>
    );
  }

  if (step === "login") {
    return (
      <Shell>
        <BrandMark subtitle="Welcome back to premium banking" />
        <div
          className="rounded-3xl p-6 backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
          }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <Field icon={<Mail className="w-4 h-4" />} label="Email address">
              <input type="email" autoComplete="email" value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com" className={inputCls} required />
            </Field>
            <Field icon={<Lock className="w-4 h-4" />} label="Password">
              <input type="password" autoComplete="current-password" value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Your password" className={inputCls} required />
            </Field>

            {info && <p className="text-xs" style={{ color: GOLD }}>{info}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="submit" className={primaryBtn}>Login</button>
          </form>
        </div>

        <p className="text-sm text-center text-white/50 mt-6">
          New to FastCredit?{" "}
          <button
            type="button"
            onClick={() => { setError(null); setInfo(null); setStep("register"); }}
            className="font-semibold hover:opacity-80 transition"
            style={{ color: GOLD }}
          >
            Create an account
          </button>
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <BrandMark subtitle="Create your premium account" />
      <div
        className="rounded-3xl p-6 backdrop-blur-xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
        }}
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <Field icon={<User className="w-4 h-4" />} label="Full name">
            <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
              placeholder="Jane Doe" className={inputCls} required />
          </Field>
          <Field icon={<Phone className="w-4 h-4" />} label="Phone number">
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)}
              inputMode="tel" placeholder="+234 800 000 0000" className={inputCls} required />
          </Field>
          <Field icon={<Globe className="w-4 h-4" />} label="Country">
            <select value={form.country} onChange={(e) => update("country", e.target.value)}
              className={`${inputCls} appearance-none`} required>
              <option value="" className="bg-neutral-900">Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c} className="bg-neutral-900">{c}</option>)}
            </select>
          </Field>
          <Field icon={<Mail className="w-4 h-4" />} label="Email address">
            <input type="email" autoComplete="email" value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com" className={inputCls} required />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />} label="Password">
            <input type="password" autoComplete="new-password" value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 8 characters" className={inputCls} required />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />} label="Confirm password">
            <input type="password" autoComplete="new-password" value={form.confirm}
              onChange={(e) => update("confirm", e.target.value)}
              placeholder="Repeat password" className={inputCls} required />
          </Field>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" className={`${primaryBtn} mt-2`}>Create Account</button>
        </form>
      </div>

      <p className="text-sm text-center text-white/50 mt-6">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => { setError(null); setInfo(null); setStep("login"); }}
          className="font-semibold hover:opacity-80 transition"
          style={{ color: GOLD }}
        >
          Login
        </button>
      </p>

      <p className="text-[11px] text-center text-white/30 mt-3">
        By continuing you agree to our Terms & Privacy Policy.
      </p>
    </Shell>
  );
}

const inputCls =
  "w-full pl-9 pr-3 py-2.5 rounded-xl outline-none text-sm text-white placeholder:text-white/30 transition " +
  "bg-white/[0.03] border border-white/10 focus:border-[#D4AF37]/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#D4AF37]/20";

const primaryBtn =
  "w-full font-semibold py-3 rounded-xl transition-all text-black shadow-lg " +
  "hover:brightness-110 active:scale-[0.98] bg-gradient-to-r from-[#D4AF37] to-[#B8912E] shadow-[#D4AF37]/30";

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">{label}</span>
      <div className="mt-1.5 relative">
        <span className="text-white/40 absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");
  function setAt(i: number, ch: string) {
    const clean = ch.replace(/\D/g, "").slice(0, 1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = clean || " ";
    const next = arr.join("").replace(/\s+$/g, "");
    onChange(next.trimEnd());
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }
  return (
    <div className="flex gap-2 justify-center" onPaste={(e) => {
      const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (t) { e.preventDefault(); onChange(t); refs.current[Math.min(t.length, 5)]?.focus(); }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d.trim()}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i].trim() && i > 0) refs.current[i - 1]?.focus();
          }}
          inputMode="numeric"
          maxLength={1}
          className="w-11 h-13 text-center text-lg font-bold rounded-xl outline-none text-white bg-white/[0.03] border border-white/10 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 py-3"
        />
      ))}
    </div>
  );
}
