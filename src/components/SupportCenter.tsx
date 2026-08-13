import { useEffect, useRef, useState } from "react";
import {
  X, Send, Bot, ChevronLeft, Mail, MessageCircle, Phone,
  ExternalLink, Search, HelpCircle, Ticket, Clock, ArrowUpRight,
} from "lucide-react";
import { useSiteSettings, supportHref, type SupportRow } from "@/lib/site-settings";

export type SupportSection = "home" | "live" | "faq" | "contact" | "tickets";

const FAQS: { q: string; a: string }[] = [
  { q: "How do I deposit money?", a: "Tap Deposit, choose a plan or amount, pay to the bank or crypto wallet shown, then upload your payment receipt. An admin reviews it and your balance is credited once approved." },
  { q: "Why is my deposit still pending?", a: "Every receipt is reviewed manually. This usually takes a short while. You'll get an email as soon as it's approved or rejected." },
  { q: "How do I withdraw?", a: "You need an active plan and to meet the minimum balance. Choose your country and bank, pay the withdrawal fee for your plan, upload the fee receipt, then confirm. You'll get a pending email immediately and an approval email once processed." },
  { q: "Why is there a withdrawal fee?", a: "The network/processing fee depends on your active plan and is shown in your local currency right before you confirm the withdrawal." },
  { q: "How does mining work?", a: "You can tap to mine twice every 24 hours while your plan is active. When a plan expires, mining is paused until you upgrade again." },
  { q: "How do referrals work?", a: "Share your referral code from your profile. You earn a bonus for each friend who joins and activates a plan." },
  { q: "My account says suspended", a: "A suspended account was restricted by our team. Contact support on Telegram so we can review and restore it." },
  { q: "I didn't get my OTP code", a: "Check your spam folder and make sure the email address is correct. Request a new code after a minute, or contact support if it still doesn't arrive." },
];

function telegramRow(support: SupportRow[]): SupportRow | null {
  return support.find((s) => s.kind === "telegram") ?? null;
}

export function TelegramButton({ className = "" }: { className?: string }) {
  const { support } = useSiteSettings();
  const row = telegramRow(support);
  const href = row ? supportHref(row) : "https://t.me/fastcreditglobal";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F4CF5B] to-[#D4AF37] px-4 py-3 font-black text-[#1a1405] active:scale-[.98] transition ${className}`}
    >
      <Send className="h-4 w-4" />
      Contact Telegram Support
    </a>
  );
}

type ChatMsg = { role: "user" | "assistant"; content: string; escalate?: boolean };

function LiveChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi 👋 I'm FastCredit Live Support. Ask me about deposits, withdrawals, plans, mining or your account." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function send(text: string) {
    const value = text.trim();
    if (!value || loading) return;
    const next = [...messages, { role: "user" as const, content: value }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "Support is busy right now, please try again in a moment." : "Support is unavailable right now.");
      const data = (await res.json()) as { reply: string; escalate: boolean };
      setMessages((m) => [...m, { role: "assistant", content: data.reply, escalate: data.escalate }]);
    } catch (e) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: e instanceof Error ? e.message : "Something went wrong.",
        escalate: true,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const quick = ["How do I deposit?", "Why is my withdrawal pending?", "How does mining work?"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-2"}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#F4CF5B] to-[#D4AF37] grid place-items-center">
                <Bot className="h-4 w-4 text-[#1a1405]" />
              </div>
            )}
            <div className={m.role === "user"
              ? "max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-[#F4CF5B] to-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#1a1405]"
              : "max-w-[85%] space-y-2"}>
              <p className={m.role === "user" ? "" : "text-sm leading-relaxed text-white/85 whitespace-pre-wrap"}>{m.content}</p>
              {m.escalate && <TelegramButton className="text-sm" />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#F4CF5B] to-[#D4AF37] grid place-items-center">
              <Bot className="h-4 w-4 text-[#1a1405]" />
            </div>
            <span className="text-sm text-white/50 animate-pulse">Typing…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {quick.map((q) => (
            <button key={q} onClick={() => send(q)}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] text-white/70">
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-2"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Type your question…"
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-white/30 max-h-32"
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-gradient-to-br from-[#F4CF5B] to-[#D4AF37] text-[#1a1405] disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="pt-2 text-center text-[10px] text-white/30">AI answers are for guidance. For account issues use Telegram support.</p>
    </div>
  );
}

function Faq() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const list = FAQS.filter((f) => (f.q + f.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
        <Search className="h-4 w-4 text-white/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for help…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
      </div>
      {list.map((f, i) => (
        <button key={f.q} onClick={() => setOpen(open === i ? null : i)}
          className="w-full text-left rounded-2xl border border-white/10 bg-[#141414] p-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-4 w-4 text-[#D4AF37] shrink-0" />
            <p className="font-bold text-sm flex-1">{f.q}</p>
          </div>
          {open === i && <p className="mt-2 text-[13px] leading-relaxed text-white/60">{f.a}</p>}
        </button>
      ))}
      {list.length === 0 && <p className="text-center text-sm text-white/40 py-6">No results — try Live Support.</p>}
    </div>
  );
}

function Contact({ onLive }: { onLive: () => void }) {
  const { support } = useSiteSettings();
  const cards = [
    { icon: MessageCircle, title: "Live Chat", desc: "Chat with our AI support agent", cta: "Start Chat", onClick: onLive },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/50">Choose a way to contact us</p>
      {cards.map((c) => (
        <div key={c.title} className="rounded-2xl border border-white/10 bg-[#141414] p-4">
          <div className="flex gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#F4CF5B] to-[#D4AF37] grid place-items-center shrink-0">
              <c.icon className="h-5 w-5 text-[#1a1405]" />
            </div>
            <div className="min-w-0">
              <p className="font-black">{c.title}</p>
              <p className="text-[13px] text-white/50">{c.desc}</p>
              <p className="text-[13px] text-white/50">We usually reply in a few minutes</p>
            </div>
          </div>
          <button onClick={c.onClick}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#F4CF5B] to-[#D4AF37] py-2.5 font-black text-[#1a1405]">
            {c.cta}
          </button>
        </div>
      ))}

      <div className="rounded-2xl border border-white/10 bg-[#141414] p-4">
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#F4CF5B] to-[#D4AF37] grid place-items-center shrink-0">
            <Send className="h-5 w-5 text-[#1a1405]" />
          </div>
          <div className="min-w-0">
            <p className="font-black">Telegram Support</p>
            <p className="text-[13px] text-white/50">Message our team directly on Telegram</p>
          </div>
        </div>
        <TelegramButton className="mt-3 w-full" />
      </div>

      {support.filter((s) => s.kind !== "telegram").map((s) => {
        const Icon = s.kind === "whatsapp" ? MessageCircle : s.kind === "email" ? Mail : s.kind === "phone" ? Phone : ExternalLink;
        return (
          <a key={s.id} href={supportHref(s)} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4 active:scale-[.98] transition">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#F4CF5B] to-[#D4AF37] grid place-items-center shrink-0">
              <Icon className="h-5 w-5 text-[#1a1405]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black truncate">{s.label}</p>
              <p className="text-[11px] text-white/50 truncate">{s.value}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 opacity-60" />
          </a>
        );
      })}

      <div className="rounded-2xl border border-white/10 bg-[#141414] p-4">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Clock className="h-4 w-4" />
          <p className="font-bold text-sm">Support Hours</p>
        </div>
        <p className="mt-1 text-center text-sm text-white/60">Monday – Sunday: 8:00 AM – 10:00 PM</p>
      </div>
    </div>
  );
}

function Tickets({ onLive }: { onLive: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 text-center">
      <Ticket className="h-8 w-8 mx-auto text-[#D4AF37]" />
      <p className="mt-3 font-black">No support tickets yet</p>
      <p className="mt-1 text-[13px] text-white/50">Start a chat with Live Support — if we can't resolve it, our Telegram team takes over.</p>
      <button onClick={onLive} className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#F4CF5B] to-[#D4AF37] py-2.5 font-black text-[#1a1405]">
        Start Live Support
      </button>
      <TelegramButton className="mt-2 w-full" />
    </div>
  );
}

export function SupportCenter({ section, onSection, onClose }: {
  section: SupportSection;
  onSection: (s: SupportSection) => void;
  onClose: () => void;
}) {
  const titles: Record<SupportSection, string> = {
    home: "Support Center",
    live: "Live AI Support",
    faq: "Frequently Asked Questions",
    contact: "Contact Support",
    tickets: "My Support Tickets",
  };

  // Keep the device/browser Back button on the dashboard: opening Support pushes
  // one history entry, and Back simply closes the overlay instead of leaving the app.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const poppedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.pushState({ fastcreditSupport: true }, "");
    const onPop = () => {
      poppedRef.current = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!poppedRef.current && window.history.state?.fastcreditSupport) {
        window.history.back();
      }
    };
  }, []);

  const goDashboard = () => {
    if (typeof window !== "undefined" && window.history.state?.fastcreditSupport) {
      poppedRef.current = true;
      window.history.back();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#0D0D0D] text-white flex flex-col">
      <div className="shrink-0 border-b border-white/5 px-4 py-4 flex items-center gap-3 max-w-[720px] w-full mx-auto">
        {section !== "home" ? (
          <button onClick={() => onSection("home")} aria-label="Back" className="h-9 w-9 grid place-items-center rounded-full bg-white/[0.06] border border-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={goDashboard} aria-label="Back to dashboard" className="h-9 w-9 grid place-items-center rounded-full bg-white/[0.06] border border-white/10">
            <ChevronLeft className="h-4 w-4 text-[#D4AF37]" />
          </button>
        )}
        <h2 className="flex-1 text-center font-black">{titles[section]}</h2>
        <button onClick={goDashboard} aria-label="Close support" className="h-9 w-9 grid place-items-center rounded-full bg-white/[0.06] border border-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[720px] mx-auto h-full">

          {section === "home" && (
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-2xl font-black text-[#D4AF37]">Support Center</h3>
                <p className="text-sm text-white/50">We're here to help you.</p>
              </div>
              {([
                { key: "live", icon: MessageCircle, title: "Live AI Support", desc: "Chat with our support assistant" },
                { key: "contact", icon: Mail, title: "Contact Support", desc: "Telegram, email and more" },
                { key: "tickets", icon: Ticket, title: "My Support Tickets", desc: "View your support requests" },
                { key: "faq", icon: HelpCircle, title: "Frequently Asked Questions", desc: "Find answers to common questions" },
              ] as const).map((r) => (
                <button key={r.key} onClick={() => onSection(r.key)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-4 text-left active:scale-[.98] transition">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#F4CF5B] to-[#D4AF37] grid place-items-center shrink-0">
                    <r.icon className="h-5 w-5 text-[#1a1405]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{r.title}</p>
                    <p className="text-[12px] text-white/50">{r.desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-50" />
                </button>
              ))}
              <TelegramButton className="w-full" />
            </div>
          )}
          {section === "live" && <LiveChat />}
          {section === "faq" && <Faq />}
          {section === "contact" && <Contact onLive={() => onSection("live")} />}
          {section === "tickets" && <Tickets onLive={() => onSection("live")} />}
        </div>
      </div>
    </div>
  );
}
