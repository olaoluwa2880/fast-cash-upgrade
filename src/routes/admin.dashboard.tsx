import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users, UserCheck, Clock, Wallet, CheckCircle2, XCircle, Ban, Crown, Search, Check, X, ShieldOff,
} from "lucide-react";
import { AdminLayout, useAdmin } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/dashboard")({
  component: () => (<AdminLayout><Dashboard /></AdminLayout>),
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
});

type Tab = "withdrawals" | "upgrades" | "users" | "payments" | "fees";
type StatusFilter = "all" | "pending" | "approved" | "rejected";

type Row = {
  id: string;
  user_id: string;
  amount?: number | string;
  currency?: string;
  wallet_address?: string | null;
  reference?: string | null;
  plan?: string | null;
  status?: "pending" | "approved" | "rejected";
  created_at: string;
  method?: string | null;
  receipt_url?: string | null;
  receipt_path?: string | null;

  rejection_reason?: string | null;
  plan_index?: number | null;
  credited?: boolean;
  profile?: { email: string | null; full_name: string | null } | null;
};


function StatCard({
  icon: Icon, label, value, iconBg, iconColor,
}: { icon: typeof Users; label: string; value: string | number; iconBg: string; iconColor: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-4 shadow-sm">
      <div className={`h-9 w-9 rounded-full ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

function Dashboard() {
  const { stats, refresh } = useAdmin();
  const [tab, setTab] = useState<Tab>("withdrawals");
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    let data: Row[] = [];
    const attach = async (list: Row[]) => {
      const ids = [...new Set(list.map((r) => r.user_id))];
      if (!ids.length) return list;
      const { data: profs } = await supabase.from("profiles").select("id,email,full_name").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return list.map((r) => ({ ...r, profile: map.get(r.user_id) as Row["profile"] ?? null }));
    };
    if (tab === "withdrawals") {
      const { data: d } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
      data = await attach((d ?? []) as Row[]);
    } else if (tab === "upgrades") {
      const { data: d } = await supabase.from("upgrades").select("*").order("created_at", { ascending: false });
      data = await attach((d ?? []) as Row[]);
    } else if (tab === "payments" || tab === "fees") {
      const { data: d } = tab === "payments"
        ? await supabase.from("payments").select("*").order("created_at", { ascending: false })
        : await supabase.from("withdrawal_fees").select("*").order("created_at", { ascending: false });
      const normalized = ((d ?? []) as any[]).map((r) =>
        tab === "fees" ? { ...r, amount: r.amount_ngn, currency: r.currency ?? "NGN" } : r
      ) as Row[];
      const withProfiles = await attach(normalized);
      // sign receipt URLs (one-by-one so a single bad path can't break the whole batch)
      const paths = [...new Set(withProfiles.map((r) => r.receipt_url).filter((p): p is string => !!p))];
      const signedMap = new Map<string, string>();
      await Promise.all(
        paths.map(async (p) => {
          if (/^https?:\/\//i.test(p)) { signedMap.set(p, p); return; }
          const { data: s, error } = await supabase.storage.from("receipts").createSignedUrl(p, 60 * 60);
          if (error) { console.error("sign receipt failed", p, error.message); return; }
          if (s?.signedUrl) signedMap.set(p, s.signedUrl);
        })
      );
      data = withProfiles.map((r) => ({
        ...r,
        receipt_path: r.receipt_url ?? null,
        receipt_url: r.receipt_url ? signedMap.get(r.receipt_url) ?? null : null,
      })) as Row[];

    } else {
      const { data: d } = await supabase.from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false });
      data = (d ?? []).map((p) => ({
        id: p.id, user_id: p.id, created_at: p.created_at,
        profile: { email: p.email, full_name: p.full_name },
      }));
    }
    setRows(data);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "users" && status !== "all" && r.status !== status) return false;
      if (!s) return true;
      const hay = `${r.profile?.full_name ?? ""} ${r.profile?.email ?? ""} ${r.wallet_address ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [rows, q, status, tab]);

  async function notify(userId: string, title: string, body: string, kind: string) {
    await supabase.from("notifications").insert({ user_id: userId, title, body, kind });
    try {
      const { sendPushNotification } = await import("@/lib/push.functions");
      await sendPushNotification({ data: { userId, title, body, url: "/", tag: `admin-${kind}` } });
    } catch (e) { console.error("push send failed", e); }
  }

  async function emailTxn(userId: string, kind: "deposit" | "withdrawal", event: "approved" | "rejected", amount: number, currency: string, reason?: string, usdAmount?: number) {
    try {
      const { sendTransactionEmail } = await import("@/lib/notifications.functions");
      await sendTransactionEmail({ data: { userId, kind, event, amount, currency, reason, usdAmount } });
    } catch (e) { console.error("email send failed", e); }
  }

  async function creditBalance(userId: string, amount: number) {
    const { data: existing } = await supabase.from("wallet_balances").select("balance_usd").eq("user_id", userId).maybeSingle();
    const current = Number(existing?.balance_usd ?? 0);
    const next = current + amount;
    if (existing) {
      await supabase.from("wallet_balances").update({ balance_usd: next }).eq("user_id", userId);
    } else {
      await supabase.from("wallet_balances").insert({ user_id: userId, balance_usd: next });
    }
  }

  async function approve(tableKey: "payments" | "withdrawals" | "upgrades" | "fees", r: Row) {
    const table = tableKey === "fees" ? "withdrawal_fees" : tableKey;
    setBusy(r.id);
    const { data: u } = await supabase.auth.getUser();
    await supabase.from(table).update({ status: "approved", reviewed_by: u.user?.id ?? null, reviewed_at: new Date().toISOString() }).eq("id", r.id);
    if (tableKey === "fees") {
      await notify(r.user_id, "Withdrawal fee confirmed", `Your withdrawal fee of ₦${Number(r.amount ?? 0).toLocaleString("en-NG")} has been confirmed. You can now submit your withdrawal request.`, "success");
      setBusy(null);
      await Promise.all([load(), refresh()]);
      return;
    }
    if (table === "payments" && !r.credited && r.amount != null) {
      if (r.plan_index != null) {
        // Mining plan upgrade — activate plan, do NOT credit balance
        await supabase.from("payments").update({ credited: true }).eq("id", r.id);
        await notify(r.user_id, "🎉 Mining plan upgrade approved", "Congratulations! Your mining plan upgrade has been approved successfully. You can now start mining.", "success");
        await emailTxn(r.user_id, "deposit", "approved", Number(r.amount), r.currency ?? "USD");
      } else {
        await creditBalance(r.user_id, Number(r.amount));
        await supabase.from("payments").update({ credited: true }).eq("id", r.id);
        await notify(r.user_id, "Payment approved", `Your deposit of ${Number(r.amount).toFixed(2)} ${r.currency ?? "USD"} has been approved and credited to your wallet.`, "success");
        await emailTxn(r.user_id, "deposit", "approved", Number(r.amount), r.currency ?? "USD");
      }
    } else if (table === "withdrawals") {
      const wAmt = Number((r as any).local_amount ?? r.amount ?? 0);
      const wCur = r.currency ?? "USD";
      await notify(r.user_id, "Withdrawal completed", `Your withdrawal of ${wAmt.toFixed(2)} ${wCur} has been approved and completed.`, "success");
      await emailTxn(r.user_id, "withdrawal", "approved", wAmt, wCur, undefined, Number(r.amount ?? 0));

    } else if (table === "upgrades") {
      await notify(r.user_id, "Upgrade approved", `Your plan upgrade has been approved.`, "success");
    }
    setBusy(null);
    await Promise.all([load(), refresh()]);
  }

  async function reject(table: "payments" | "withdrawals" | "upgrades" | "fees", r: Row) {
    const reason = window.prompt("Reason for rejection (optional)") ?? "";
    setBusy(r.id);
    const { data: u } = await supabase.auth.getUser();
    const reviewed = { status: "rejected" as const, reviewed_by: u.user?.id ?? null, reviewed_at: new Date().toISOString() };
    if (table === "payments") {
      await supabase.from("payments").update({ ...reviewed, rejection_reason: reason || null }).eq("id", r.id);
    } else if (table === "fees") {
      await supabase.from("withdrawal_fees").update({ ...reviewed, rejection_reason: reason || null }).eq("id", r.id);
    } else if (table === "withdrawals") {
      // Atomic reject + refund reserved funds back to the user's wallet.
      const { error: refundErr } = await supabase.rpc("refund_withdrawal", { p_id: r.id });
      if (refundErr) {
        // Fallback: at least mark rejected so it doesn't stay pending.
        await supabase.from("withdrawals").update(reviewed).eq("id", r.id);
      }
    } else {
      await supabase.from("upgrades").update(reviewed).eq("id", r.id);
    }
    await notify(r.user_id, `${table === "payments" ? "Payment" : table === "withdrawals" ? "Withdrawal" : table === "fees" ? "Withdrawal fee" : "Upgrade"} rejected`, reason ? `Reason: ${reason}` : "Your request was rejected. Please contact support.", "error");
    if (table === "payments" || table === "withdrawals") {
      const amt = table === "withdrawals" ? Number((r as any).local_amount ?? r.amount ?? 0) : Number(r.amount ?? 0);
      await emailTxn(r.user_id, table === "payments" ? "deposit" : "withdrawal", "rejected", amt, r.currency ?? "USD", reason || undefined, table === "withdrawals" ? Number(r.amount ?? 0) : undefined);
    }

    setBusy(null);
    await Promise.all([load(), refresh()]);
  }


  async function banUser(userId: string) {
    setBusy(userId);
    const { data: existing } = await supabase.from("user_bans").select("user_id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("user_bans").delete().eq("user_id", userId);
    } else {
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("user_bans").upsert({ user_id: userId, banned_by: u.user?.id ?? null, reason: "suspended by admin" }, { onConflict: "user_id" });
    }
    setBusy(null);
    await Promise.all([load(), refresh()]);
  }


  const tabs: { key: Tab; label: string }[] = [
    { key: "withdrawals", label: "Withdrawals" },
    { key: "upgrades", label: "Upgrades" },
    { key: "users", label: "Users" },
    { key: "payments", label: "Payments" },
    { key: "fees", label: "Withdrawal fees" },
  ];
  const statuses: StatusFilter[] = ["all", "pending", "approved", "rejected"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={UserCheck} label="Active (7d)" value={stats.active7d} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatCard icon={Wallet} label="Paid USDC" value={stats.paidUsdc.toFixed(2)} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={XCircle} label="Rejected" value={stats.rejected} iconBg="bg-red-100" iconColor="text-red-500" />
        <StatCard icon={Ban} label="Banned" value={stats.banned} iconBg="bg-red-100" iconColor="text-red-500" />
        <StatCard icon={Crown} label="Upgrades" value={stats.upgrades} iconBg="bg-amber-100" iconColor="text-amber-600" />
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-full p-1 flex items-center shadow-sm overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              tab === t.key ? "bg-blue-600 text-white shadow" : "text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by user, email, wallet..."
          className="w-full pl-10 pr-4 py-3 rounded-full bg-white/80 backdrop-blur border border-white text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none"
        />
      </div>

      {tab !== "users" && (
        <div className="flex items-center gap-1 bg-white/60 backdrop-blur-xl border border-white rounded-full p-1 shadow-sm overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap ${
                status === s ? "bg-blue-600 text-white shadow" : "text-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-8 text-center text-slate-500 shadow-sm">
            No {tab} match your filters
          </div>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="bg-white/80 backdrop-blur-xl border border-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {r.profile?.full_name || r.profile?.email || "Unknown user"}
                </div>
                <div className="text-xs text-slate-500 truncate">{r.profile?.email}</div>
                {r.wallet_address && (
                  <div className="text-xs text-slate-500 mt-1 font-mono truncate">{r.wallet_address}</div>
                )}
                {r.plan && <div className="text-xs text-slate-600 mt-1">Plan: <span className="font-medium">{r.plan}</span></div>}
                {r.method && <div className="text-xs text-slate-600 mt-1">Method: <span className="font-medium">{r.method}</span></div>}
                {r.reference && <div className="text-xs text-slate-500 mt-1">Ref: {r.reference}</div>}
                <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">UID: {r.user_id.slice(0, 8)}…</div>
                <div className="text-[11px] text-slate-400 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                {r.rejection_reason && <div className="text-xs text-red-600 mt-1">Reason: {r.rejection_reason}</div>}
              </div>
              <div className="text-right shrink-0">
                {r.amount != null && (
                  <div className="text-lg font-extrabold text-slate-900 tabular-nums">
                    {Number(r.amount).toFixed(2)} <span className="text-xs text-slate-500 font-medium">{r.currency ?? "USDC"}</span>
                  </div>
                )}
                {r.status && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                    r.status === "pending" ? "bg-amber-100 text-amber-700"
                      : r.status === "approved" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600"
                  }`}>{r.status}</span>
                )}
                {tab === "payments" && r.credited && (
                  <div className="text-[10px] text-amber-600 font-semibold mt-1">Credited</div>
                )}
              </div>
            </div>

            {(tab === "payments" || tab === "fees") && r.receipt_path && (
              r.receipt_url ? (
                <div className="mt-3">
                  {/\.pdf($|\?)/i.test(r.receipt_path) ? (
                    <a href={r.receipt_url} target="_blank" rel="noreferrer" className="block w-full py-6 rounded-xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-600">
                      PDF receipt — open ↗
                    </a>
                  ) : (
                    <div className="max-h-96 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-slate-50">
                      <img src={r.receipt_url} alt="Payment receipt" className="w-full h-auto block" />
                    </div>
                  )}
                  <a href={r.receipt_url} target="_blank" rel="noreferrer" className="block text-[11px] text-blue-600 mt-1 text-center">
                    Open full receipt ↗
                  </a>
                </div>
              ) : (
                <div className="mt-3 text-[11px] text-red-500">Receipt uploaded but preview unavailable ({r.receipt_path.split("/").pop()})</div>
              )
            )}



            <div className="flex gap-2 mt-3">
              {tab === "users" ? (
                <button
                  disabled={busy === r.user_id}
                  onClick={() => banUser(r.user_id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <ShieldOff className="h-4 w-4" /> Ban user
                </button>
              ) : r.status === "pending" ? (
                <>
                  <button
                    disabled={busy === r.id}
                    onClick={() => approve(tab, r)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    disabled={busy === r.id}
                    onClick={() => reject(tab, r)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full bg-white border border-red-200 text-red-600 text-sm font-semibold disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </>
              ) : null}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
