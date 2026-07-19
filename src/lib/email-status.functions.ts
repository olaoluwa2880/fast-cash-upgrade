import { createServerFn } from "@tanstack/react-start";
import { listEmailLogs } from "@lovable.dev/email-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SENDER_DOMAIN = "notify.fastcreditglobal.com";
const OTP_TYPES = new Set(["signup", "magiclink", "recovery", "reauthentication", "invite", "email_change"]);

export type OtpEmailStatus = {
  senderDomain: string;
  verified: boolean | null;
  windowHours: number;
  totals: {
    sent: number;
    rejected: number;
    bounced: number;
    complained: number;
    suppressed: number;
    rate_limited: number;
    other: number;
  };
  recent: Array<{
    timestamp: string;
    recipient: string;
    event_type: string;
    status?: string;
    tag?: string;
  }>;
  historyStartsAt: string | null;
  checkedAt: string;
  error?: string;
};

export const getOtpEmailStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OtpEmailStatus> => {
    const { data: role } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role) throw new Error("Forbidden");

    const apiKey = process.env.LOVABLE_API_KEY;
    const checkedAt = new Date().toISOString();
    const windowHours = 24;
    const since = new Date(Date.now() - windowHours * 3600_000).toISOString();

    const empty: OtpEmailStatus = {
      senderDomain: SENDER_DOMAIN,
      verified: null,
      windowHours,
      totals: { sent: 0, rejected: 0, bounced: 0, complained: 0, suppressed: 0, rate_limited: 0, other: 0 },
      recent: [],
      historyStartsAt: null,
      checkedAt,
    };

    if (!apiKey) return { ...empty, error: "LOVABLE_API_KEY not configured" };

    try {
      const res = await listEmailLogs({ since, limit: 100 }, { apiKey });
      const otpEvents = res.data.filter((e) =>
        (e.tags ?? []).some((t) => OTP_TYPES.has(t)) || OTP_TYPES.has(e.event_type),
      );
      const totals = { ...empty.totals };
      for (const e of otpEvents) {
        const k = e.event_type as keyof typeof totals;
        if (k in totals) (totals as Record<string, number>)[k]++;
        else totals.other++;
      }
      // Domain considered verified if any sent event exists in window OR history stretches beyond retention.
      const verified = totals.sent > 0 || res.data.some((e) => e.event_type === "sent");
      const recent = otpEvents.slice(0, 15).map((e) => ({
        timestamp: e.timestamp,
        recipient: maskEmail(e.recipient),
        event_type: e.event_type,
        status: e.status,
        tag: (e.tags ?? []).find((t) => OTP_TYPES.has(t)),
      }));
      return {
        ...empty,
        verified,
        totals,
        recent,
        historyStartsAt: res.history_starts_at ?? null,
      };
    } catch (err) {
      return { ...empty, error: err instanceof Error ? err.message : String(err) };
    }
  });

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const shown = user.slice(0, 2);
  return `${shown}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
