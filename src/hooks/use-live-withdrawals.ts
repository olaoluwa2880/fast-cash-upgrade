import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecentWithdrawals } from "@/lib/live-withdrawals.functions";
import { usePush } from "@/components/PushNotifications";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", NGN: "₦", GHS: "₵", EUR: "€", GBP: "£",
  ZAR: "R", CFA: "CFA ", CAD: "CA$", AUD: "A$",
};

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
  const [items, setItems] = useState<{ name: string; amount: string }[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    let alive = true;
    fetchRecent({ data: { limit: 20 } })
      .then((rows) => {
        if (!alive) return;
        setItems(rows.map((r) => ({ name: r.name, amount: formatAmount(r.amount, r.currency) })));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [fetchRecent]);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      const item = items[indexRef.current % items.length];
      indexRef.current += 1;
      push({
        title: `${item.name} has withdrawn ${item.amount}`,
        message: "FastCredit withdrawal approved instantly",
        kind: "wallet",
        durationMs: 5000,
      });
    }, 9000);
    return () => clearInterval(timer);
  }, [items, push]);
}
