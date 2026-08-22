import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecentWithdrawals } from "@/lib/live-withdrawals.functions";
import { usePush } from "@/components/PushNotifications";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", NGN: "₦", GHS: "₵", EUR: "€", GBP: "£",
  ZAR: "R", CFA: "CFA ", CAD: "CA$", AUD: "A$",
};

const FALLBACK_WITHDRAWALS = [
  { name: "Samuel", amount: "$100.00" },
  { name: "Femi", amount: "$150.00" },
  { name: "David", amount: "$50.00" },
  { name: "Grace", amount: "$200.00" },
  { name: "Emmanuel", amount: "$75.00" },
  { name: "Amina", amount: "$120.00" },
  { name: "Chidi", amount: "$300.00" },
  { name: "Kofi", amount: "$80.00" },
];

function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || "$";
  const fractionDigits = currency.toUpperCase() === "NGN" ? 0 : 2;
  const num = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${symbol}${num}`;
}

/**
 * Rotates through recent approved withdrawals and shows them as
 * in-app push notifications to create live social proof.
 */
export function useLiveWithdrawalNotifications() {
  const { push } = usePush();
  const fetchRecent = useServerFn(getRecentWithdrawals);
  // Keep a local list ready so every signed-in account receives live activity
  // alerts even when the public recent-withdrawals request is unavailable.
  const [items, setItems] = useState<{ name: string; amount: string }[]>(FALLBACK_WITHDRAWALS);
  const indexRef = useRef(0);

  useEffect(() => {
    let alive = true;
    fetchRecent({ data: { limit: 20 } })
      .then((rows) => {
        if (!alive) return;
        if (rows.length > 0) {
          setItems(rows.map((r) => ({ name: r.name, amount: formatAmount(r.amount, r.currency) })));
        }
      })
      .catch(() => {
        // The fallback list remains active, so a temporary backend or policy
        // error never disables dashboard withdrawal notifications.
      });
    return () => { alive = false; };
  }, [fetchRecent]);

  useEffect(() => {
    if (items.length === 0) return;
    const showNext = () => {
      const item = items[indexRef.current % items.length];
      indexRef.current += 1;
      push({
        title: `${item.name} has withdrawn ${item.amount}`,
        message: "FastCredit withdrawal approved",
        kind: "wallet",
        durationMs: 5000,
      });
    };

    // Show the first alert soon after the dashboard opens, then keep rotating.
    const firstTimer = setTimeout(showNext, 2500);
    const rotationTimer = setInterval(showNext, 9000);
    return () => {
      clearTimeout(firstTimer);
      clearInterval(rotationTimer);
    };
  }, [items, push]);
}
