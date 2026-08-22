import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const Input = z.object({ limit: z.number().int().min(1).max(50).default(20) });

export type LiveWithdrawal = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  when: string;
};

/**
 * Returns the most recently approved withdrawals with a display name.
 * Used for the live social-proof ticker on the dashboard.
 */
export const getRecentWithdrawals = createServerFn({ method: "GET" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data: rows, error } = await supabasePublic
      .from("withdrawals")
      .select("id, amount, currency, created_at, user_id, profiles(full_name)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);

    const demoNames = ["Samuel", "Femi", "David", "Grace", "Emmanuel", "Chidi", "Amina", "Tunde", "Ngozi", "Kofi"];

    const results: LiveWithdrawal[] = (rows ?? []).map((row: any, idx: number) => {
      const profile = row.profiles as { full_name?: string | null } | null;
      const fallback = demoNames[idx % demoNames.length];
      const rawName = profile?.full_name?.trim() || fallback;
      const firstName = rawName.split(" ")[0];
      return {
        id: row.id,
        name: firstName,
        amount: Number(row.amount || 0),
        currency: row.currency || "USD",
        when: row.created_at,
      };
    });

    // If the database has no approved withdrawals yet, seed a few demo notifications
    // so the ticker is never empty on a fresh app.
    if (results.length === 0) {
      const demoAmounts = [100, 150, 50, 200, 75, 120, 300, 80];
      return demoAmounts.map((amount, idx) => ({
        id: `demo-${idx}`,
        name: demoNames[idx % demoNames.length],
        amount,
        currency: "USD",
        when: new Date(Date.now() - idx * 60_000).toISOString(),
      }));
    }

    return results;
  });
