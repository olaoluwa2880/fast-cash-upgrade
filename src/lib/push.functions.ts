import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RegisterInput = z.object({
  token: z.string().min(10),
  platform: z.string().default("web"),
  userAgent: z.string().optional(),
});

export const registerPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RegisterInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          user_id: userId,
          token: data.token,
          platform: data.platform,
          user_agent: data.userAgent ?? null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "token" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unregisterPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("push_tokens").delete().eq("token", data.token);
    return { ok: true };
  });

const SendInput = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  body: z.string().max(500).default(""),
  url: z.string().max(500).optional(),
  tag: z.string().max(100).optional(),
});

// Sends a push to the target user. If userId is omitted, sends to the caller.
// Sending to another user requires admin role.
export const sendPushNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SendInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let targetUserId = data.userId ?? userId;
    if (targetUserId !== userId) {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (!isAdmin) throw new Error("Forbidden");
    }

    // Load recipient tokens via the admin client so RLS on the caller doesn't hide other users' rows.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("push_tokens")
      .select("token")
      .eq("user_id", targetUserId);
    if (error) throw new Error(error.message);
    const tokens = (rows ?? []).map((r) => r.token).filter(Boolean);
    if (tokens.length === 0) return { sent: 0, tokens: 0 };

    const { sendToTokens } = await import("./fcm.server");
    const { sent, invalid } = await sendToTokens(tokens, {
      title: data.title,
      body: data.body,
      url: data.url ?? "/",
      tag: data.tag,
    });

    if (invalid.length > 0) {
      await supabaseAdmin.from("push_tokens").delete().in("token", invalid);
    }
    return { sent, tokens: tokens.length };
  });
