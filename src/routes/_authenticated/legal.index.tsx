import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText, ArrowLeft } from "lucide-react";
import { LEGAL_META, LEGAL_SLUGS, useLegalDocs } from "@/lib/legal";

export const Route = createFileRoute("/_authenticated/legal/")({
  head: () => ({ meta: [{ title: "Legal Center · FastCredit" }] }),
  component: LegalIndex,
});

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
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-100 via-sky-100 to-sky-200">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Link to="/" className="h-10 w-10 rounded-full bg-white/70 backdrop-blur border border-white flex items-center justify-center shadow-sm">
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">Legal Center</h1>
          <p className="text-xs text-slate-500">Everything you need to know about FastCredit</p>
        </div>
      </header>

      <div className="px-5 pb-10 space-y-3">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-3xl p-5 shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide opacity-80">FastCredit</div>
              <div className="text-lg font-extrabold leading-tight">Legal & Information</div>
            </div>
          </div>
          <p className="text-[12px] mt-3 opacity-90">
            Read our policies, terms, working hours, and a full guide to how FastCredit works — all in one place.
          </p>
        </div>

        {loading && (
          <div className="bg-white/70 backdrop-blur border border-white rounded-2xl p-6 text-center text-slate-500 text-sm">Loading…</div>
        )}

        {items.map((it) => (
          <Link
            key={it.slug}
            to="/legal/$slug"
            params={{ slug: it.slug }}
            className="block bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-sm hover:bg-white transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">{it.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate">{it.title}</div>
                <div className="text-[11px] text-slate-500 truncate">{it.blurb}</div>
                {it.updated_at && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Updated {new Date(it.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
