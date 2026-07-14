import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, Wallet, Coins, Gift } from "lucide-react";

export type PushKind = "success" | "error" | "info" | "wallet" | "reward" | "bonus";

export type PushNotification = {
  id: string;
  title: string;
  message?: string;
  kind?: PushKind;
  at: number;
  onTap?: () => void;
  durationMs?: number;
};

type Ctx = {
  push: (n: Omit<PushNotification, "id" | "at">) => string;
  dismiss: (id: string) => void;
};

const PushCtx = createContext<Ctx | null>(null);

export function usePush() {
  const ctx = useContext(PushCtx);
  if (!ctx) throw new Error("usePush must be used inside <PushProvider>");
  return ctx;
}

export function PushProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PushNotification[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
    const t = timers.current[id];
    if (t) { clearTimeout(t); delete timers.current[id]; }
  }, []);

  const push = useCallback((n: Omit<PushNotification, "id" | "at">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: PushNotification = { id, at: Date.now(), durationMs: 4200, ...n };
    setItems(prev => [item, ...prev].slice(0, 5));
    timers.current[id] = setTimeout(() => dismiss(id), item.durationMs);
    return id;
  }, [dismiss]);

  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <PushCtx.Provider value={value}>
      {children}
      <PushStack items={items} onDismiss={dismiss} />
    </PushCtx.Provider>
  );
}

function PushStack({ items, onDismiss }: { items: PushNotification[]; onDismiss: (id: string) => void }) {
  return (
    <div
      className="pointer-events-none fixed left-0 right-0 z-[100] flex flex-col items-center gap-2 px-3"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      aria-live="polite"
    >
      {items.map(n => (
        <PushCard key={n.id} n={n} onDismiss={() => onDismiss(n.id)} />
      ))}
    </div>
  );
}

function iconFor(kind: PushKind = "info") {
  const cls = "h-5 w-5";
  switch (kind) {
    case "success": return <CheckCircle2 className={cls + " text-emerald-500"} />;
    case "error":   return <AlertTriangle className={cls + " text-red-500"} />;
    case "wallet":  return <Wallet className={cls + " text-emerald-500"} />;
    case "reward":  return <Coins className={cls + " text-amber-500"} />;
    case "bonus":   return <Gift className={cls + " text-pink-500"} />;
    default:        return <Info className={cls + " text-sky-500"} />;
  }
}

function timeAgo(at: number, now: number) {
  const s = Math.max(0, Math.floor((now - at) / 1000));
  if (s < 5) return "Just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

function PushCard({ n, onDismiss }: { n: PushNotification; onDismiss: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const startLeave = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onDismiss, 260);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    const dy = e.clientY - startY.current;
    if (dy < 0) setDragY(dy);
  };
  const onPointerUp = () => {
    if (dragY < -40) startLeave();
    else setDragY(0);
    startY.current = null;
  };

  const translate = leaving
    ? "translate3d(0,-140%,0)"
    : mounted
      ? `translate3d(0, ${dragY}px, 0)`
      : "translate3d(0,-140%,0)";

  const opacity = leaving ? 0 : mounted ? Math.max(0, 1 + dragY / 120) : 0;

  return (
    <div
      role="alert"
      onClick={() => { if (n.onTap) { n.onTap(); startLeave(); } }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="pointer-events-auto w-full max-w-md cursor-pointer select-none rounded-2xl border border-white/40 bg-white/70 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70"
      style={{
        transform: translate,
        opacity,
        transition: dragY === 0
          ? "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease"
          : "none",
        touchAction: "pan-x",
        willChange: "transform, opacity",
      }}
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-slate-800/80">
          {iconFor(n.kind)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
              {n.title}
            </p>
            <span className="ml-auto shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {timeAgo(n.at, now)}
            </span>
          </div>
          {n.message && (
            <p className="mt-0.5 line-clamp-3 text-[12.5px] leading-snug text-slate-700 dark:text-slate-200">
              {n.message}
            </p>
          )}
        </div>
        <div className="mt-1 h-1 w-6 shrink-0 rounded-full bg-slate-300/70 dark:bg-slate-600/70" aria-hidden />
      </div>
    </div>
  );
}

// Utility for callers that only have the legacy string toast API.
export function useSimplePush() {
  const { push } = usePush();
  return (title: string, message?: string, kind: PushKind = "info") =>
    push({ title, message, kind });
}
