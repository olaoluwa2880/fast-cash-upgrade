import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText, ArrowLeft } from "lucide-react";
import { LEGAL_META, LEGAL_SLUGS, useLegalDocs } from "@/lib/legal";

export const Route = createFileRoute("/_authenticated/legal/")({
  head: () => ({ meta: [{ title: "Legal Center · FastCredit" }] }),
  component: LegalIndex,
});

const GOLD = "#D4AF37";

function LegalIndex() {
  const { docs, loading } = useLegalDocs();
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  const items = LEGAL_SLUGS.map((slug) => {
    const doc = bySlug.get(slug);
    return {
      slug,
      title: doc?.title ?? slug,
      updated_at: doc?.updated_at ?? null,
      ...LEGAL_META[slug],
    };
  });

  return (
    <div className="min-h-[100dvh] relative overflow-hidden" style={{ backgroundColor: "#0D0D0D" }}>
      <div
        className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
      />
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 relative z-10">
        <Link
          to="/"
          className="h-10 w-10 rounded-full flex items-center justify-center transition hover:brightness-125"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-white leading-tight tracking-tight">Legal Center</h1>
          <p className="text-xs text-white/50">Everything you need to know about FastCredit</p>
        </div>
      </header>

      <div className="px-5 pb-10 space-y-3 relative z-10">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${GOLD} 0%, #B8912E 100%)`,
            boxShadow: `0 20px 40px -12px ${GOLD}55`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-black/20 flex items-center justify-center backdrop-blur">
              <FileText className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-black/70 font-semibold">FastCredit</div>
              <div className="text-lg font-black text-black leading-tight">Legal & Information</div>
            </div>
          </div>
          <p className="text-[12px] mt-3 text-black/80">
            Read our policies, terms, working hours, and a full guide to how FastCredit works — all in one place.
          </p>
        </div>

        {loading && (
          <div
            className="rounded-2xl p-6 text-center text-white/50 text-sm backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Loading…
          </div>
        )}

        {items.map((it) => (
          <Link
            key={it.slug}
            to="/legal/$slug"
            params={{ slug: it.slug }}
            className="block rounded-2xl p-4 backdrop-blur-xl transition hover:brightness-125 active:scale-[0.99]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}44` }}
              >
                {it.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{it.title}</div>
                <div className="text-[11px] text-white/50 truncate">{it.blurb}</div>
                {it.updated_at && (
                  <div className="text-[10px] text-white/30 mt-0.5">
                    Updated {new Date(it.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-white/30 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
