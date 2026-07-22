import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, Bitcoin, Power } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/crypto-wallets")({
  component: () => (<AdminLayout><Page /></AdminLayout>),
  head: () => ({ meta: [{ title: "Admin — Crypto Wallets" }] }),
});

type Wallet = {
  id: string;
  symbol: string;
  network: string;
  address: string;
  label: string | null;
  enabled: boolean;
  sort_order: number;
};
const EMPTY: Omit<Wallet, "id"> = { symbol: "USDT", network: "TRC20", address: "", label: "", enabled: true, sort_order: 0 };

const PRESETS = ["USDT/TRC20", "USDT/ERC20", "USDT/BEP20", "BTC/Bitcoin", "ETH/ERC20", "BNB/BEP20", "SOL/Solana", "USDC/ERC20"];

function Page() {
  const [rows, setRows] = useState<Wallet[]>([]);
  const [form, setForm] = useState<Omit<Wallet, "id">>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("crypto_wallets").select("*").order("sort_order").order("created_at");
    setRows((data ?? []) as Wallet[]);
  }, []);
  useEffect(() => { load(); }, [load]);
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 1800); }

  async function save() {
    if (!form.symbol.trim() || !form.network.trim() || !form.address.trim()) { flash("Symbol, network and address required"); return; }
    if (form.address.trim().length < 10) { flash("Address looks too short"); return; }
    const payload = { ...form, label: form.label || null };
    if (editing) await supabase.from("crypto_wallets").update(payload).eq("id", editing);
    else await supabase.from("crypto_wallets").insert(payload);
    setEditing(null); setForm(EMPTY); await load(); flash("Saved");
  }
  async function remove(id: string) { if (!confirm("Delete this wallet?")) return; await supabase.from("crypto_wallets").delete().eq("id", id); await load(); }
  async function toggle(r: Wallet) { await supabase.from("crypto_wallets").update({ enabled: !r.enabled }).eq("id", r.id); await load(); }
  function edit(r: Wallet) {
    setEditing(r.id);
    setForm({ symbol: r.symbol, network: r.network, address: r.address, label: r.label ?? "", enabled: r.enabled, sort_order: r.sort_order });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold flex items-center gap-2"><Bitcoin className="h-5 w-5 text-amber-500" /> Crypto Wallets</h1>
      {msg && <div className="text-xs bg-amber-100 text-amber-700 px-3 py-2 rounded-lg">{msg}</div>}

      <div className="bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="font-semibold text-slate-800 text-sm">{editing ? "Edit wallet" : "Add new wallet"}</div>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => {
            const [sym, net] = p.split("/");
            return (
              <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, symbol: sym, network: net }))}
                className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] hover:bg-blue-50 hover:text-blue-700">{p}</button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Symbol (BTC, USDT)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} />
          <input className="px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Network (TRC20, ERC20)" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} />
          <input className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono" placeholder="Wallet address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value.trim() })} />
          <input className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Label (optional)" value={form.label ?? ""} onChange={(e) => setForm({ ...form, label: e.target.value })} />
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
        {rows.length === 0 && <div className="text-center text-sm text-slate-500 py-6">No wallets yet</div>}
        {rows.map((r) => (
          <div key={r.id} className="bg-white/80 backdrop-blur border border-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{r.symbol} <span className="text-xs text-slate-500">· {r.network}</span></div>
                {r.label && <div className="text-xs text-slate-500">{r.label}</div>}
                <div className="text-xs font-mono text-slate-600 mt-1 break-all">{r.address}</div>
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
