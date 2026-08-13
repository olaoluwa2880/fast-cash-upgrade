import { X, LifeBuoy, HelpCircle, Mail, Ticket, Settings, User, LogOut, MessageCircle } from "lucide-react";

export type SideMenuAction =
  | "support" | "live" | "faq" | "contact" | "tickets" | "settings" | "profile" | "logout";

const ITEMS: { key: SideMenuAction; label: string; icon: typeof LifeBuoy; desc: string }[] = [
  { key: "live", label: "Live Support", icon: MessageCircle, desc: "Chat with our AI assistant" },
  { key: "support", label: "Support", icon: LifeBuoy, desc: "Support center" },
  { key: "faq", label: "FAQ", icon: HelpCircle, desc: "Common questions" },
  { key: "contact", label: "Contact Support", icon: Mail, desc: "Telegram, email & more" },
  { key: "tickets", label: "My Tickets", icon: Ticket, desc: "Your support requests" },
  { key: "settings", label: "Settings", icon: Settings, desc: "App preferences" },
  { key: "profile", label: "Profile", icon: User, desc: "Your account details" },
];

export function SideMenu({ open, onClose, onSelect, name, subtitle }: {
  open: boolean;
  onClose: () => void;
  onSelect: (a: SideMenuAction) => void;
  name: string;
  subtitle: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <button aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <aside className="absolute right-0 top-0 h-full w-[82%] max-w-[340px] bg-[#111] border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]">FastCredit</p>
            <p className="font-black truncate">{name}</p>
            <p className="text-[11px] text-white/40 truncate">{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="h-9 w-9 grid place-items-center rounded-full bg-white/[0.06] border border-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {ITEMS.map((it) => (
            <button key={it.key} onClick={() => onSelect(it.key)}
              className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white/[0.06] active:scale-[.98] transition">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#F4CF5B] to-[#D4AF37] grid place-items-center shrink-0">
                <it.icon className="h-4 w-4 text-[#1a1405]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm">{it.label}</p>
                <p className="text-[11px] text-white/40 truncate">{it.desc}</p>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button onClick={() => onSelect("logout")}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-red-400 hover:bg-red-500/10 active:scale-[.98] transition">
            <div className="h-10 w-10 rounded-xl bg-red-500/15 grid place-items-center shrink-0">
              <LogOut className="h-4 w-4" />
            </div>
            <p className="font-bold text-sm">Logout</p>
          </button>
        </div>
      </aside>
    </div>
  );
}
