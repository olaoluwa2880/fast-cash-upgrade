import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are FastCredit Live Support, the AI assistant for FastCredit Global — a mobile finance app with wallet balances, deposits (bank transfer & crypto), withdrawals, mining rewards, upgrade plans, referrals and a legal center.

Rules:
- Be warm, short and clear (max ~120 words). Use simple language.
- Common topics you can answer: how to deposit, upload a payment receipt, why a deposit is pending, how to withdraw (needs an active plan, minimum balance, withdrawal fee based on plan/country), plan upgrades, mining taps (2 per 24h, needs an active plan), referral bonus, changing currency, account suspension, login/OTP problems.
- Deposits and withdrawals are reviewed manually by admins; approvals send an email notification.
- Never invent balances, transaction IDs or timelines you cannot know.
- If the user needs account-specific action (money not credited, suspended account, refund, ID/verification, anything you cannot resolve), clearly explain that the issue requires a FastCredit support agent to review it.
`;

export const Route = createFileRoute("/api/support-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { messages?: Msg[] } | null;
        const messages = Array.isArray(body?.messages) ? body!.messages!.slice(-16) : null;
        if (!messages) return new Response("messages required", { status: 400 });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages: [{ role: "system", content: SYSTEM }, ...messages],
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          return Response.json(
            { error: text, status: res.status },
            { status: res.status === 429 || res.status === 402 ? res.status : 500 },
          );
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        let reply = data.choices?.[0]?.message?.content?.trim() ?? "";
        reply = reply.replace(/ESCALATE_TELEGRAM/g, "").trim();
        if (!reply) reply = "I couldn't process that request. Please try asking again with more details.";

        return Response.json({ reply });
      },
    },
  },
});
