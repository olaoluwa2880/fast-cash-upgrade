import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SENDER_DOMAIN = "notify.fastcreditglobal.com";
const ROOT_DOMAIN = "fastcreditglobal.com";
const EXPECTED_TXT_HOST = `_lovable-email.${ROOT_DOMAIN}`;
const EXPECTED_TXT_VALUE =
  "lovable_email_verify=eb485913db50f66ab09536058670cb46a6a6f4051bcdbe1a4c8136da3e186358";
const EXPECTED_NS = ["ns3.lovable.cloud", "ns4.lovable.cloud"];

export type DnsCheck = {
  name: string;
  type: "TXT" | "NS";
  host: string;
  expected: string[];
  found: string[];
  ok: boolean;
  error?: string;
  note?: string;
};

export type DomainStatus = {
  senderDomain: string;
  overall: "active" | "pending" | "failed";
  summary: string;
  failureReason?: string;
  checks: DnsCheck[];
  checkedAt: string;
};

export const getDomainStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DomainStatus> => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role) throw new Error("Forbidden");

    const dns = await import("dns/promises");

    const checks: DnsCheck[] = [];

    // TXT ownership check
    try {
      const txt = await dns.resolveTxt(EXPECTED_TXT_HOST);
      const flat = txt.map((chunks) => chunks.join(""));
      const ok = flat.some((v) => v.trim() === EXPECTED_TXT_VALUE);
      const truncated = flat.some((v) => v.includes("...") || v.includes("…"));
      checks.push({
        name: "Ownership verification (TXT)",
        type: "TXT",
        host: EXPECTED_TXT_HOST,
        expected: [EXPECTED_TXT_VALUE],
        found: flat,
        ok,
        note: !ok && truncated
          ? "The TXT value at your registrar looks abbreviated (contains '...'). Paste the FULL token exactly, without any ellipsis."
          : !ok
          ? "TXT record does not match the expected verification token."
          : undefined,
      });
    } catch (e: any) {
      checks.push({
        name: "Ownership verification (TXT)",
        type: "TXT",
        host: EXPECTED_TXT_HOST,
        expected: [EXPECTED_TXT_VALUE],
        found: [],
        ok: false,
        error: e?.code || String(e?.message ?? e),
        note: "No TXT record found. Add it at your DNS provider.",
      });
    }

    // NS delegation check
    try {
      const ns = (await dns.resolveNs(SENDER_DOMAIN)).map((n) => n.toLowerCase());
      const ok = EXPECTED_NS.every((e) => ns.includes(e));
      checks.push({
        name: "Subdomain delegation (NS)",
        type: "NS",
        host: SENDER_DOMAIN,
        expected: EXPECTED_NS,
        found: ns,
        ok,
        note: !ok ? "NS records for the 'notify' subdomain don't match Lovable's nameservers." : undefined,
      });
    } catch (e: any) {
      checks.push({
        name: "Subdomain delegation (NS)",
        type: "NS",
        host: SENDER_DOMAIN,
        expected: EXPECTED_NS,
        found: [],
        ok: false,
        error: e?.code || String(e?.message ?? e),
        note: "No NS records found for the 'notify' subdomain.",
      });
    }

    const allOk = checks.every((c) => c.ok);
    const anyFound = checks.some((c) => c.found.length > 0);
    const overall: DomainStatus["overall"] = allOk ? "active" : anyFound ? "failed" : "pending";
    const failing = checks.find((c) => !c.ok);
    const summary = allOk
      ? "All DNS records verified. Domain is active and can send OTP emails."
      : failing?.note || failing?.error || "One or more DNS records are missing or incorrect.";

    return {
      senderDomain: SENDER_DOMAIN,
      overall,
      summary,
      failureReason: allOk ? undefined : failing?.note || failing?.error,
      checks,
      checkedAt: new Date().toISOString(),
    };
  });
