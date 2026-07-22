import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, Landmark, Power } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/bank-details")({
  component: () => (<AdminLayout><Page /></AdminLayout>),
  head: () => ({ meta: [{ title: "Admin — Bank Details" }] }),
});

type Bank = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  enabled: boolean;
  sort_order: number;
};

const EMPTY: Omit<Bank, "id"> = {
  bank_name: "", account_name: "", account_number: "", currency: "NGN", enabled: true, sort_order: 0,
};

function Page() {
  const [rows, setRows] = useState<Bank[]>([]);
  const [form, setForm] = useState<Omit<Bank, "id">>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("bank_details").select("*").order("sort_order").order("created_at");
    setRows((data ?? []) as Bank[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 1800); }

  async function save() {
    if (!form.bank_name.trim() || !form.account_name.trim() || !form.account_number.trim()) {
      flash("Fill all fields"); return;
    }
    setBusy(true);
    if (editing) {
      await supabase.from("bank_details").update(form).eq("id", editing);
    } else {
      await supabase.from("bank_details").insert(form);
    }
    setBusy(false); setEditing(null); setForm(EMPTY); await load(); flash("Saved");
  }
  async function remove(id: string) {
    if (!confirm("Delete this bank?")) return;
    await supabase.from("bank_details").delete().eq("id", id); await load();
  }
  async function toggle(r: Bank) {
    await supabase.from("bank_details").update({ enabled: !r.enabled }).eq("id", r.id); await load();
  }
  function edit(r: Bank) {
    setEditing(r.id);
    setForm({ bank_name: r.bank_name, account_name: r.account_name, account_number: r.account_number, currency: r.currency, enabled: r.enabled, sort_order: r.sort_order });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold flex items-center gap-2"><Landmark className="h-5 w-5 text-blue-600" /> Bank Details</h1>
      {msg && <div className="text-xs bg-amber-100 text-amber-700 px-3 py-2 rounded-lg">{msg}</div>}

      <div className="bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="font-semibold text-slate-800 text-sm">{editing ? "Edit bank" : "Add new bank"}</div>
        <div className="grid grid-cols-2 gap-2">
          <input className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Bank name" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
          <input className="px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Account name" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
          <input className="px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Account number" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
          <input className="px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Currency (e.g. NGN)" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
          <label className="flex items-center gap-2 text-xs text-slate-600 px-2">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled
          </label>
        </div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={save} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
            {editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editing ? "Update" : "Add"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(EMPTY); }} className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm">Cancel</button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {rows.length === 0 && <div className="text-center text-sm text-slate-500 py-6">No banks yet</div>}
        {rows.map((r) => (
          <div key={r.id} className="bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{r.bank_name} <span className="text-xs text-slate-500">({r.currency})</span></div>
                <div className="text-sm text-slate-700">{r.account_name}</div>
                <div className="text-sm font-mono text-slate-600">{r.account_number}</div>
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
