import { createServerFn } from "@tanstack/react-start";
import { BANKS_BY_COUNTRY, FLW_SUPPORTED, type Bank } from "./banks-data";

// Fetch banks for a country. Tries Flutterwave's live /v3/banks/{country}
// endpoint when FLUTTERWAVE_SECRET_KEY is configured; otherwise returns the
// bundled dataset. Always resolves — never throws — so the UI can render.
export const getBanksForCountry = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): { country: string } => {
    const c = (input as { country?: string })?.country;
    if (!c || typeof c !== "string" || c.length !== 2) {
      throw new Error("country must be a 2-letter ISO code");
    }
    return { country: c.toUpperCase() };
  })
  .handler(async ({ data }): Promise<{ source: "flutterwave" | "static"; banks: Bank[] }> => {
    const country = data.country;
    const fallback = BANKS_BY_COUNTRY[country] ?? [];
    const key = process.env.FLUTTERWAVE_SECRET_KEY;

    if (key && FLW_SUPPORTED.has(country)) {
      try {
        const res = await fetch(`https://api.flutterwave.com/v3/banks/${country}`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) {
          const json = (await res.json()) as { status?: string; data?: Array<{ name: string; code: string }> };
          if (json?.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
            const banks = json.data
              .map((b) => ({ name: b.name, code: b.code }))
              .sort((a, b) => a.name.localeCompare(b.name));
            return { source: "flutterwave", banks };
          }
        }
      } catch {
        // fall through to static
      }
    }

    return {
      source: "static",
      banks: [...fallback].sort((a, b) => a.name.localeCompare(b.name)),
    };
  });
