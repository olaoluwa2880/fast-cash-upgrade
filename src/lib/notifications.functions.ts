import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  userId: z.string().uuid().optional(),
  kind: z.enum(["deposit", "withdrawal"]),
  event: z.enum(["submitted", "approved", "rejected"]),
  amount: z.number().nonnegative(),
  currency: z.string().max(8).default("USD"),
  reason: z.string().max(500).optional(),
});

/**
 * Sends a transactional email to the target user for a deposit/withdrawal
 * lifecycle event. Callers can only email themselves unless they are admin.
 */
export const sendTransactionEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data.userId ?? userId;
    if (target !== userId) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!isAdmin) throw new Error("Forbidden");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userInfo, error: uErr } = await supabaseAdmin.auth.admin.getUserById(target);
    if (uErr || !userInfo?.user?.email) {
      return { sent: false, reason: "no_email" as const };
    }
    const email = userInfo.user.email;
    const name =
      (userInfo.user.user_metadata as any)?.full_name ||
      (userInfo.user.user_metadata as any)?.name ||
      email.split("@")[0];

    const { sendTemplateEmail } = await import("./email-templates/send-email");
    try {
      const result = await sendTemplateEmail("transaction", email, {
        templateData: {
          kind: data.kind,
          event: data.event,
          amount: data.amount,
          currency: data.currency,
          reason: data.reason,
          name,
        },
        idempotencyKey: `tx-${target}-${data.kind}-${data.event}-${Math.round(data.amount * 100)}-${Date.now()}`,
      });
      return result;
    } catch (e) {
      console.error("sendTransactionEmail failed", e);
      return { sent: false, reason: "error" as const };
    }
  });
