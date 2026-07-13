import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BankRow = {
  id: string; bank_name: string; account_name: string; account_number: string;
  currency: string; enabled: boolean; sort_order: number;
};
export type WalletRow = {
  id: string; symbol: string; network: string; address: string;
  label: string | null; enabled: boolean; sort_order: number;
};
export type SupportRow = {
  id: string; kind: string; label: string; value: string; enabled: boolean; sort_order: number;
};
export type CommunityRow = {
  id: string; title: string; url: string; platform: string; enabled: boolean; sort_order: number;
};

export type SiteSettings = {
  banks: BankRow[];
  wallets: WalletRow[];
  support: SupportRow[];
  community: CommunityRow[];
  loaded: boolean;
};

const EMPTY: SiteSettings = { banks: [], wallets: [], support: [], community: [], loaded: false };

export function useSiteSettings(): SiteSettings {
  const [state, setState] = useState<SiteSettings>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [b, w, s, c] = await Promise.all([
        supabase.from("bank_details").select("*").eq("enabled", true).order("sort_order").order("created_at"),
        supabase.from("crypto_wallets").select("*").eq("enabled", true).order("sort_order").order("created_at"),
        supabase.from("support_settings").select("*").eq("enabled", true).order("sort_order").order("created_at"),
        supabase.from("community_links").select("*").eq("enabled", true).order("sort_order").order("created_at"),
      ]);
      if (cancelled) return;
      setState({
        banks: (b.data ?? []) as BankRow[],
        wallets: (w.data ?? []) as WalletRow[],
        support: (s.data ?? []) as SupportRow[],
        community: (c.data ?? []) as CommunityRow[],
        loaded: true,
      });
    }
    load();
    const channel = supabase
      .channel("site-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_details" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "crypto_wallets" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_settings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_links" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  return state;
}

export function supportHref(row: SupportRow): string {
  const v = row.value.trim();
  if (/^https?:\/\//i.test(v) || v.startsWith("mailto:") || v.startsWith("tel:")) return v;
  switch (row.kind) {
    case "telegram": return `https://t.me/${v.replace(/^@/, "")}`;
    case "whatsapp": return `https://wa.me/${v.replace(/[^\d]/g, "")}`;
    case "email":    return `mailto:${v}`;
    case "phone":    return `tel:${v.replace(/\s+/g, "")}`;
    default:         return v;
  }
}
