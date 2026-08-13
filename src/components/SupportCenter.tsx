import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, X, MessageCircle, HelpCircle, Mail, Search, ChevronRight,
  Send, Phone, MessageSquare, Facebook, Instagram, Twitter, Globe, LifeBuoy,
} from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useSiteSettings, supportHref, openSupport, type SupportRow } from "@/lib/site-settings";

export type SupportSection = "home" | "live" | "faq" | "contact";

type ChatMsg = { role: "user" | "assistant"; content: string };

const FAQS: { q: string; a: string }[] = [
  { q: "How do I deposit?", a: "Open Deposit on your dashboard, pick a plan, choose bank transfer or crypto, pay to the shown details and upload your payment receipt. An admin reviews and approves it, then your balance updates." },
  { q: "Why is my deposit still pending?", a: "Every deposit receipt is reviewed manually by an admin. Once approved you get an email and your wallet is credited. Pending usually clears within working hours." },
  { q: "How do I withdraw?", a: "You need an active plan and the minimum balance. Open Withdraw, select your country and bank, enter the amount, pay the withdrawal fee for your plan and submit. You will get an email with the pending amount in your local currency." },
  { q: "What is the withdrawal fee?", a: "The fee depends on your current plan and is shown in your local currency at the bottom of the withdrawal review step, right before you confirm." },
  { q: "How does mining work?", a: "You get 2 taps every 24 hours while your plan is active. After 2 taps a countdown starts. If your plan expires, mining is locked until you upgrade." },
  { q: "How do plan upgrades work?", a: "Plans run in 7-day cycles and you can only move up to a higher tier. Upgrading resets your mining cycle." },
  { q: "How do referrals work?", a: "Share your referral code from your Profile. You earn a bonus when your invite joins and activates a plan." },
  { q: "My account says suspended", a: "A suspended account was restricted by an admin. Contact support below and an agent will review your account." },
];

function kindIcon(kind: string) {
  switch (kind) {
    case "telegram": return Send;
    case "whatsapp": return MessageCircle;
    case "gmail":
    case "email": return Mail;
    case "phone": return Phone;
    case "sms": return MessageSquare;
    case "facebook": return Facebook;
    case "instagram": return Instagram;
    case "twitter": return Twitter;
    case "website": return Globe;
    case "live_chat": return MessageCircle;
    default: return LifeBuoy;
  }
}

function LiveChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi, I'm FastCredit Live Support. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      const data = (await res.json()) as { reply: string };
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: e instanceof Error ? e.message : "Something went wrong.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0">
        <ConversationContent className="gap-4 px-0 py-3">
        {messages.map((m, i) => (
          <Message key={`${m.role}-${i}`} from={m.role}>
            <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent px-0 py-0"}>
              <MessageResponse>{m.content}</MessageResponse>
            </MessageContent>
          </Message>
        ))}
        {loading && (
          <Message from="assistant">
            <MessageContent className="bg-transparent px-0 py-0">
              <Shimmer className="text-sm">Thinking...</Shimmer>
            </MessageContent>
          </Message>
        )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={({ text }) => send(text)}
        className="border-border bg-card"
      >
        <PromptInputTextarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Live Support..."
          className="min-h-20 max-h-36"
        />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit disabled={loading || !input.trim()} status={loading ? "submitted" : "ready"} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function Faq() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(t) || f.a.toLowerCase().includes(t));
  }, [q]);

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search help topics"
          className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-3 text-sm outline-none focus:border-primary/50"
        />
      </div>
      <div className="space-y-2">
        {list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No results. Try Live Chat.</p>}
        {list.map((f, i) => (
          <div key={f.q} className="overflow-hidden rounded-2xl border border-border bg-card">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 text-sm font-semibold">{f.q}</span>
              <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open === i ? "rotate-90" : ""}`} />
            </button>
            {open === i && <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Contact({ onLive }: { onLive: () => void }) {
  const { support, loaded } = useSiteSettings();
  const rows = support.filter((r) => r.kind !== "live_chat" && supportHref(r));

  return (
    <div className="h-full space-y-2 overflow-y-auto pb-6">
      <button onClick={onLive} className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-left active:scale-[.99]">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">Live Chat</p>
          <p className="text-[11px] text-muted-foreground">Instant answers from our assistant</p>
        </div>
      </button>

      {!loaded && <p className="py-6 text-center text-xs text-muted-foreground">Loading contact options...</p>}
      {loaded && rows.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">No other contact methods available right now.</p>
      )}
      {rows.map((r: SupportRow) => {
        const Icon = kindIcon(r.kind);
        return (
          <button
            key={r.id}
            onClick={() => openSupport(supportHref(r))}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left active:scale-[.99]"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{r.label}</p>
              <p className="truncate text-[11px] text-muted-foreground">{r.value}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}

function Home({ go }: { go: (s: SupportSection) => void }) {
  const { support } = useSiteSettings();
  const telegram = support.find((r) => r.kind === "telegram" && supportHref(r));
  const items: { key: SupportSection; label: string; desc: string; icon: typeof MessageCircle }[] = [
    { key: "live", label: "Live Chat", desc: "Chat with our support assistant", icon: MessageCircle },
    { key: "faq", label: "FAQ", desc: "Answers to common questions", icon: HelpCircle },
    { key: "contact", label: "Contact Support", desc: "Telegram, WhatsApp, email & more", icon: Mail },
  ];
  return (
    <div className="h-full space-y-2 overflow-y-auto pb-6">
      {telegram && (
        <button
          onClick={() => openSupport(supportHref(telegram))}
          className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-left active:scale-[.99]"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{telegram.label || "Telegram Support"}</p>
            <p className="truncate text-[11px] text-muted-foreground">Chat with an agent on Telegram</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      )}
      {items.map((it) => (
        <button key={it.key} onClick={() => go(it.key)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left active:scale-[.99]">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <it.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{it.label}</p>
            <p className="text-[11px] text-muted-foreground">{it.desc}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}


const TITLES: Record<SupportSection, { title: string; sub: string }> = {
  home: { title: "FastCredit Support", sub: "We're here to help" },
  live: { title: "FastCredit Live Chat", sub: "Online support" },
  faq: { title: "FAQ", sub: "Common questions" },
  contact: { title: "Contact Support", sub: "Reach a human agent" },
};

export function SupportCenter({ section = "home", onClose }: {
  section?: SupportSection;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState<SupportSection>(section);
  useEffect(() => { setCurrent(section); }, [section]);
  const meta = TITLES[current];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[720px] shrink-0 items-center gap-3 border-b border-border px-4 py-4">
        <button
          onClick={() => (current === "home" ? onClose() : setCurrent("home"))}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
        >
          <ChevronLeft className="h-4 w-4 text-primary" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-black">{meta.title}</p>
          <p className="text-[11px] text-muted-foreground">{meta.sub}</p>
        </div>
        <button onClick={onClose} aria-label="Close support" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <X className="h-4 w-4" />
        </button>
      </header>
      <main className="mx-auto min-h-0 w-full max-w-[720px] flex-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        {current === "home" && <Home go={setCurrent} />}
        {current === "live" && <LiveChat />}
        {current === "faq" && <Faq />}
        {current === "contact" && <Contact onLive={() => setCurrent("live")} />}
      </main>
    </div>
  );
}
