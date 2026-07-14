import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "fastcredit_install_dismissed_at";
const DISMISS_DAYS = 3;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && isSafari;
}

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const t = parseInt(raw, 10);
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (recentlyDismissed()) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari fallback (no beforeinstallprompt)
    if (isIosSafari()) {
      setIos(true);
      const t = setTimeout(() => setOpen(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setOpen(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 px-4 pb-6 pt-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="relative p-6 text-center">
          <button
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src="/icon-192.png"
            alt="FastCredit"
            width={72}
            height={72}
            className="mx-auto rounded-2xl shadow-md"
          />
          <h2 className="mt-4 text-lg font-bold text-gray-900">Install FastCredit</h2>
          <p className="mt-1 text-sm text-gray-600">
            Install FastCredit for faster access and a better experience.
          </p>

          {ios ? (
            <div className="mt-4 text-xs text-gray-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-left">
              <Share className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
              <span>Tap the <b>Share</b> button, then select <b>Add to Home Screen</b>.</span>
            </div>
          ) : null}

          <div className="mt-5 flex gap-2">
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Not Now
            </button>
            {!ios && (
              <button
                onClick={install}
                disabled={!deferred}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Install Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
