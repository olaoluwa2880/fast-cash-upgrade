import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useLegalDoc } from "@/lib/legal";
import { renderLegal } from "@/lib/legal-render";

export const Route = createFileRoute("/_authenticated/legal/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${prettyTitle(params.slug)} · FastCredit` }] }),
  component: LegalDocPage,
});

function prettyTitle(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function LegalDocPage() {
  const { slug } = useParams({ from: "/_authenticated/legal/$slug" });
  const { doc, loading } = useLegalDoc(slug);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-100 via-sky-100 to-sky-200">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Link to="/legal" className="h-10 w-10 rounded-full bg-white/70 backdrop-blur border border-white flex items-center justify-center shadow-sm">
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold text-slate-900 leading-tight truncate">
            {doc?.title ?? prettyTitle(slug)}
          </h1>
          {doc?.updated_at && (
            <p className="text-[11px] text-slate-500">
              Last updated {new Date(doc.updated_at).toLocaleDateString(undefined, {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          )}
        </div>
      </header>

      <div className="px-5 pb-10">
        <article className="bg-white/85 backdrop-blur border border-white rounded-3xl p-5 shadow-sm">
          {loading ? (
            <div className="text-sm text-slate-500 py-6 text-center">Loading…</div>
          ) : !doc ? (
            <div className="text-sm text-slate-500 py-6 text-center">
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
