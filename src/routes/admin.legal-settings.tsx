import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, ScrollText, Eye, EyeOff } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { LEGAL_META, LEGAL_SLUGS, saveLegalDoc, useLegalDocs, type LegalSlug } from "@/lib/legal";
import { renderLegal } from "@/lib/legal-render";

export const Route = createFileRoute("/admin/legal-settings")({
  component: () => (<AdminLayout><Page /></AdminLayout>),
  head: () => ({ meta: [{ title: "Admin — Legal Settings" }] }),
});

function Page() {
  const { docs, loading } = useLegalDocs();
  const [active, setActive] = useState<LegalSlug>("privacy-policy");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const current = docs.find((d) => d.slug === active) ?? null;

  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setContent(current.content);
    } else {
      setTitle(prettyTitle(active));
      setContent("");
    }
    setPreview(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, current?.slug]);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 2000); }

  async function save() {
    if (!title.trim()) return flash("Title is required");
    setSaving(true);
    try {
      await saveLegalDoc(active, title.trim(), content);
      flash("Saved — the update is now live for all users.");
    } catch (e) {
      flash((e as Error).message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-blue-600" /> Legal Settings
      </h1>

      <p className="text-xs text-slate-600">
        Edit the Legal Center documents shown to users. Changes save instantly and appear across the app in real time.
        Formatting: use <code>#</code>, <code>##</code>, <code>###</code> for headings, <code>-</code> for bullet points, and blank lines to separate paragraphs.
      </p>

      {msg && <div className="text-xs bg-amber-100 text-amber-700 px-3 py-2 rounded-lg">{msg}</div>}

      <div className="bg-white/70 backdrop-blur border border-white rounded-full p-1 flex items-center overflow-x-auto shadow-sm">
        {LEGAL_SLUGS.map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              active === s ? "bg-blue-600 text-white shadow" : "text-slate-600"
            }`}
          >
            {LEGAL_META[s].emoji} {prettyTitle(s)}
          </button>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Content</label>
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="text-[11px] font-semibold text-blue-600 flex items-center gap-1"
            >
              {preview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="mt-1 min-h-[240px] p-3 rounded-lg border border-slate-200 bg-white">
              {renderLegal(content)}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono leading-relaxed"
              placeholder="# Heading&#10;&#10;Paragraph text…&#10;&#10;## Subheading&#10;- Bullet one&#10;- Bullet two"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            {loading ? "Loading…"
              : current
                ? `Last updated ${new Date(current.updated_at).toLocaleString()}`
                : "New document — will be created on save."}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function prettyTitle(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}
