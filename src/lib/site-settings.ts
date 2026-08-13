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

export const SUPPORT_KINDS = [
  "live_chat",
  "telegram",
  "whatsapp",
  "gmail",
  "email",
  "phone",
  "sms",
  "facebook",
  "instagram",
  "twitter",
  "discord",
  "website",
  "other",
] as const;
export type SupportKind = (typeof SUPPORT_KINDS)[number];

export function supportHref(row: SupportRow): string {
  const v = (row.value ?? "").trim();
  if (row.kind === "live_chat") return "";
  if (!v) return "";

  // Already a usable scheme
  if (/^(https?:|mailto:|tel:|sms:)/i.test(v)) return v;
  // Bare domain / path that clearly points at a website
  if (/^(www\.|t\.me\/|wa\.me\/|api\.whatsapp\.com|m\.me\/|discord\.gg\/|facebook\.com|instagram\.com|x\.com|twitter\.com)/i.test(v)) {
    return `https://${v.replace(/^\/+/, "")}`;
  }

  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  const digits = v.replace(/[^\d]/g, "");
  const handle = v.replace(/^@/, "").replace(/\s+/g, "");

  switch (row.kind) {
    case "telegram":  return handle ? `https://t.me/${handle}` : "";
    case "whatsapp":  return digits ? `https://wa.me/${digits}` : "";
    case "gmail":
    case "email":     return isEmail ? `mailto:${v}` : "";
    case "phone":     return digits ? `tel:${v.replace(/\s+/g, "")}` : "";
    case "sms":       return digits ? `sms:${v.replace(/\s+/g, "")}` : "";
    case "facebook":  return `https://facebook.com/${handle}`;
    case "instagram": return `https://instagram.com/${handle}`;
    case "twitter":   return `https://x.com/${handle}`;
    case "discord":   return /^discord/i.test(handle) ? `https://${handle}` : `https://discord.gg/${handle}`;
    case "website":   return `https://${v.replace(/^\/+/, "")}`;
    default:
      if (isEmail) return `mailto:${v}`;
      if (/^\+?[\d\s\-()]{6,}$/.test(v)) return `tel:${v.replace(/\s+/g, "")}`;
      return `https://${v.replace(/^\/+/, "")}`;
  }
}

/**
 * Opens a support link safely.
 * mailto:/tel:/sms: must use same-tab navigation — opening them in a new tab
 * leaves a blank page in mobile browsers and installed PWAs.
 */
export function openSupport(href: string) {
  if (!href || typeof window === "undefined") return;
  if (/^(mailto:|tel:|sms:)/i.test(href)) {
    window.location.href = href;
    return;
  }
  const win = window.open(href, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = href; // popup blocked / standalone PWA
}

