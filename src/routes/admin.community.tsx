import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, MessagesSquare, Power } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/community")({
  component: () => (<AdminLayout><Page /></AdminLayout>),
  head: () => ({ meta: [{ title: "Admin — Community" }] }),
});

type Row = {
  id: string;
  title: string;
  url: string;
  platform: string;
  enabled: boolean;
  sort_order: number;
};
const PLATFORMS = ["telegram", "whatsapp", "discord", "facebook", "twitter", "youtube", "other"] as const;
const EMPTY: Omit<Row, "id"> = { title: "", url: "", platform: "telegram", enabled: true, sort_order: 0 };

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Omit<Row, "id">>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("community_links").select("*").order("sort_order").order("created_at");
    setRows((data ?? []) as Row[]);
  }, []);
  useEffect(() => { load(); }, [load]);
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 1800); }

  async function save() {
    if (!form.title.trim() || !form.url.trim()) return flash("Title and URL required");
    if (!/^https?:\/\/\S+$/.test(form.url.trim())) return flash("Invalid URL (https://...)");
    if (editing) await supabase.from("community_links").update(form).eq("id", editing);
    else await supabase.from("community_links").insert(form);
    setEditing(null); setForm(EMPTY); await load(); flash("Saved");
  }
  async function remove(id: string) { if (!confirm("Delete?")) return; await supabase.from("community_links").delete().eq("id", id); await load(); }
  async function toggle(r: Row) { await supabase.from("community_links").update({ enabled: !r.enabled }).eq("id", r.id); await load(); }
  function edit(r: Row) { setEditing(r.id); setForm({ title: r.title, url: r.url, platform: r.platform, enabled: r.enabled, sort_order: r.sort_order }); }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-blue-600" /> Community</h1>
      {msg && <div className="text-xs bg-amber-100 text-amber-700 px-3 py-2 rounded-lg">{msg}</div>}

      <div className="bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="font-semibold text-slate-800 text-sm">{editing ? "Edit link" : "Add community link"}</div>
        <div className="grid grid-cols-2 gap-2">
          <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
            {PLATFORMS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <input className="px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="https://t.me/yourchannel" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value.trim() })} />
          <label className="flex items-center gap-2 text-xs text-slate-600 px-2">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold">
            {editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editing ? "Update" : "Add"}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm(EMPTY); }} className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm">Cancel</button>}
        </div>
      </div>

      <div className="space-y-2">
        {rows.length === 0 && <div className="text-center text-sm text-slate-500 py-6">No community links yet</div>}
        {rows.map((r) => (
          <div key={r.id} className="bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">{r.platform}</div>
                <div className="font-semibold text-slate-900">{r.title}</div>
                <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 break-all">{r.url}</a>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.enabled ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}>{r.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => edit(r)} className="flex-1 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">Edit</button>
              <button onClick={() => toggle(r)} className="flex-1 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"><Power className="h-3.5 w-3.5" />{r.enabled ? "Disable" : "Enable"}</button>
              <button onClick={() => remove(r.id)} className="flex-1 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold flex items-center justify-center gap-1"><Trash2 className="h-3.5 w-3.5" />Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
