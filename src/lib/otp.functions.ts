import { createServerFn } from "@tanstack/react-start";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 6;

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export const requestOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => {
    if (!data?.email || !isEmail(data.email)) throw new Error("Invalid email address.");
    return { email: data.email.trim().toLowerCase() };
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { createHash, randomInt } = await import("crypto");

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: recent, error: qErr } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("email", data.email)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });
    if (qErr) throw new Error("Could not process request. Try again.");

    if (recent && recent.length > 0) {
      const last = new Date(recent[0].created_at).getTime();
      const elapsed = Date.now() - last;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new Error(`Please wait ${wait}s before requesting another code.`);
      }
      if (recent.length >= MAX_REQUESTS_PER_HOUR) {
        throw new Error("Too many code requests. Please try again in an hour.");
      }
    }

    await supabase
      .from("otp_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("email", data.email)
      .is("used_at", null);

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const code_hash = createHash("sha256").update(`${data.email}:${code}`).digest("hex");
    const expires_at = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error: insErr } = await supabase.from("otp_codes").insert({
      email: data.email,
      code_hash,
      expires_at,
      purpose: "login",
    });
    if (insErr) throw new Error("Could not create verification code.");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Email service is not configured.");

    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
      <h2 style="color:#047857;margin:0 0 8px">Verify your sign-in</h2>
      <p style="color:#334155;font-size:14px;line-height:1.5">Use the code below to continue. It expires in 5 minutes.</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;margin:16px 0">${code}</div>
      <p style="color:#64748b;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
    </div>`;
    const text = `Your FastCredit verification code is ${code}. It expires in 5 minutes.`;

    try {
      const { sendLovableEmail } = await import("@lovable.dev/email-js");
      const { randomUUID } = await import("crypto");
      await sendLovableEmail(
        {
          to: data.email,
          from: "FastCredit Global <noreply@fastcreditglobal.com>",
          sender_domain: "notify.fastcreditglobal.com",
          subject: `Your FastCredit code: ${code}`,
          html,
          text,
          purpose: "transactional",
          idempotency_key: `otp_${data.email}_${Date.now()}_${randomUUID()}`,
          run_id: randomUUID(),
        } as any,
        { apiKey },
      );
    } catch (e: any) {
      console.error("[otp] send failed", e?.status, e?.code, e?.message);
      throw new Error(`Could not send verification email: ${e?.message ?? "unknown error"}`);
    }

    return { sent: true, cooldownSeconds: 60, expiresInSeconds: 300 };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; code: string }) => {
    if (!data?.email || !isEmail(data.email)) throw new Error("Invalid email address.");
    if (!/^\d{6}$/.test(data?.code ?? "")) throw new Error("Enter the 6-digit code.");
    return { email: data.email.trim().toLowerCase(), code: data.code };
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { createHash, timingSafeEqual } = await import("crypto");

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: row, error } = await supabase
      .from("otp_codes")
      .select("id, code_hash, expires_at, used_at, attempts")
      .eq("email", data.email)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error("Verification failed. Try again.");
    if (!row) throw new Error("No active code. Request a new one.");

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabase.from("otp_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
      throw new Error("Your code has expired. Request a new one.");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await supabase.from("otp_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
      throw new Error("Too many wrong attempts. Request a new code.");
    }

    const submitted = createHash("sha256").update(`${data.email}:${data.code}`).digest("hex");
    const a = Buffer.from(submitted);
    const b = Buffer.from(row.code_hash);
    const match = a.length === b.length && timingSafeEqual(a, b);

    if (!match) {
      await supabase.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      throw new Error("The code is incorrect. Please try again.");
    }

    await supabase.from("otp_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
    return { verified: true };
  });
