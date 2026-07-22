import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useLegalDoc } from "@/lib/legal";
import { renderLegal } from "@/lib/legal-render";

export const Route = createFileRoute("/_authenticated/legal/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${prettyTitle(params.slug)} · FastCredit` }] }),
  component: LegalDocPage,
});

const GOLD = "#D4AF37";

function prettyTitle(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function LegalDocPage() {
  const { slug } = useParams({ from: "/_authenticated/legal/$slug" });
  const { doc, loading } = useLegalDoc(slug);

  return (
    <div className="min-h-[100dvh] relative overflow-hidden" style={{ backgroundColor: "#0D0D0D" }}>
      <div
        className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
      />
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 relative z-10">
        <Link
          to="/legal"
          className="h-10 w-10 rounded-full flex items-center justify-center transition hover:brightness-125 shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-black text-white leading-tight truncate tracking-tight">
            {doc?.title ?? prettyTitle(slug)}
          </h1>
          {doc?.updated_at && (
            <p className="text-[11px] text-white/40">
              Last updated {new Date(doc.updated_at).toLocaleDateString(undefined, {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          )}
        </div>
      </header>

      <div className="px-5 pb-10 relative z-10">
        <article
          className="rounded-3xl p-5 backdrop-blur-xl prose-invert legal-content"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {loading ? (
            <div className="text-sm text-white/50 py-6 text-center">Loading…</div>
          ) : !doc ? (
            <div className="text-sm text-white/50 py-6 text-center">
              This document hasn't been published yet.
            </div>
          ) : (
            renderLegal(doc.content)
          )}
        </article>
      </div>
    </div>
  );
}
