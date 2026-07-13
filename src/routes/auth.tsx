import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, Globe, Mail, Lock, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account · Sanad" },
      { name: "description", content: "Register with your details to get started." },
    ],
  }),
  component: AuthPage,
});

const COUNTRIES = [
  "Nigeria", "Cameroon", "South Africa", "Ghana", "Kenya", "Egypt",
  "United States", "United Kingdom", "Canada", "Germany", "France",
  "United Arab Emirates", "Saudi Arabia", "India", "China", "Brazil", "Other",
];

type Step = "register" | "creating" | "otp" | "verifying";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null);
    const v = validate();
    if (v) return setError(v);
    setStep("creating");
    const email = form.email.trim();
    console.log("[auth] signUp start", { email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          country: form.country,
        },
      },
    });
    console.log("[auth] signUp result", { data, error });

    if (error) {
      setStep("register");
      return setError(`Sign up failed: ${error.message}`);
    }

    // Detect "user already registered": Supabase returns 200 with an obfuscated
    // user (identities: []) and does NOT send another email. Fall back to an
    // OTP sign-in so the user actually receives a code.
    const identities = (data.user as { identities?: unknown[] } | null)?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      console.warn("[auth] email already registered, sending OTP sign-in code instead");
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      console.log("[auth] signInWithOtp result", { otpErr });
      if (otpErr) {
        setStep("register");
        return setError(
          `This email is already registered but we couldn't send a code: ${otpErr.message}`,
        );
      }
      setInfo(`This email is already registered. We sent a sign-in code to ${email}.`);
      setCooldown(60);
      setStep("otp");
      return;
    }

    setInfo(`We sent a 6-digit code to ${email}.`);
    setCooldown(60);
    setStep("otp");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (token.trim().length < 6) return setError("Enter the 6-digit code.");
    setStep("verifying");
    const { data, error } = await supabase.auth.verifyOtp({
      email: form.email.trim(),
      token: token.trim(),
      type: "email",
    });
    if (error || !data.user) {
      setStep("otp");
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("expired")) return setError("Your verification code has expired. Please request a new code.");
      return setError("The verification code is incorrect. Please try again.");
    }
    // Persist profile details
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: form.email.trim(),
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      country: form.country,
    }, { onConflict: "id" });

    navigate({ to: "/" });
  }

  async function resend() {
    if (cooldown > 0) return;
    setError(null); setInfo(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: form.email.trim(),
    });
    if (error) return setError(error.message);
    setInfo("A new code was sent.");
    setCooldown(60);
  }

  if (step === "creating" || step === "verifying") {
    const title = step === "creating" ? "Creating your account…" : "Verifying your account…";
    const sub = step === "creating"
      ? "Please wait while we prepare your account."
      : "Setting up your dashboard…";
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-6">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-2">{sub}</p>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter the 6-digit code sent to <span className="font-medium text-gray-700">{form.email}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <OtpBoxes value={token} onChange={setToken} />
              {info && <p className="text-xs text-emerald-600 text-center">{info}</p>}
              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Verify
              </button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => { setStep("register"); setToken(""); setError(null); setInfo(null); }}
                  className="text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={cooldown > 0}
                  className="text-emerald-600 hover:text-emerald-700 font-medium disabled:text-gray-400"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-4">
            <User className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in your details to get started.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6">
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
                className={`${inputCls} appearance-none bg-white`} required>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
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

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition mt-2">
              Create Account
            </button>
          </form>
        </div>

        <p className="text-[11px] text-center text-gray-400 mt-6">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm";

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="mt-1 relative">
        <span className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
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
          className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
        />
      ))}
    </div>
  );
}
