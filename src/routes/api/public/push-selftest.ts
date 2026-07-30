import { createFileRoute } from "@tanstack/react-router";

// Temporary diagnostic: verifies the push service credentials can mint a token.
// Returns no secrets — only ok/error status.
export const Route = createFileRoute("/api/public/push-selftest")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
          if (!raw) return Response.json({ ok: false, stage: "config", error: "service account not set" });
          const { sendToTokens } = await import("@/lib/fcm.server");
          // empty token list exercises nothing; use a bogus token to force auth + send
          const res = await sendToTokens(["invalid-token-selftest"], { title: "t", body: "b" });
          return Response.json({ ok: true, stage: "sent", res });
        } catch (e: any) {
          return Response.json({ ok: false, stage: "auth", error: e?.message ?? String(e) });
        }
      },
    },
  },
});
