import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, X } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: () => (
    <AdminLayout>
      <UsersPage />
    </AdminLayout>
  ),
  head: () => ({ meta: [{ title: "Admin — Users" }] }),
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  currency: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

const PAGE_SIZE = 25;

function UsersPage() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [bans, setBans] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    const [{ data: profs }, { data: banRows }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_bans").select("user_id"),
    ]);
    setRows(profs ?? []);
    setBans(new Set((banRows ?? []).map((b) => b.user_id)));
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  async function toggleBan(userId: string, currentlyBanned: boolean) {
    setBusy(userId);
    if (currentlyBanned) {
      await supabase.from("user_bans").delete().eq("user_id", userId);
    } else {
      if (!window.confirm("Suspend this user? They will be signed out immediately and unable to log in.")) {
        setBusy(null); return;
      }
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("user_bans").upsert(
        { user_id: userId, banned_by: u.user?.id ?? null, reason: "suspended by admin" },
        { onConflict: "user_id" },
      );
    }
    setBusy(null);
    await reload();
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const thirtyAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return rows.filter((r) => {
      if (s) {
        const hay = `${r.full_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (status === "suspended") {
        if (!bans.has(r.id)) return false;
      } else if (status !== "all") {
        const active = new Date(r.updated_at).getTime() > thirtyAgo;
        if (status === "active" && !active) return false;
        if (status === "inactive" && active) return false;
      }
      return true;
    });
  }, [rows, q, status, bans]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function exportCsv() {
    const headers = ["id", "full_name", "email", "phone", "country", "currency", "created_at"];
    const csv = [
      headers.join(","),
      ...filtered.map((r) =>
        headers
          .map((h) => {
            const v = (r as unknown as Record<string, unknown>)[h];
            const s = v == null ? "" : String(v);
            return `"${s.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-2 rounded-lg"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white"
        >
          <option value="all">All</option>
          <option value="active">Active (30d)</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-950 text-gray-400 text-left">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Full Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Registered</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">Loading…</td>
              </tr>
            )}
            {!loading && pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">No users found</td>
              </tr>
            )}
            {pageRows.map((r) => {
              const active =
                new Date(r.updated_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
              return (
                <tr key={r.id} className="border-t border-gray-800">
                  <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                    {r.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2 text-white">{r.full_name ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-300">{r.email ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-300">{r.phone ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        active
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-gray-700/40 text-gray-400"
                      }`}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setSelected(r)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <div>
          Showing {pageRows.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
          {(currentPage - 1) * PAGE_SIZE + pageRows.length} of {filtered.length}
        </div>
        <div className="flex gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded bg-gray-800 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2 py-1">
            {currentPage} / {pages}
          </span>
          <button
            disabled={currentPage >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="px-3 py-1 rounded bg-gray-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">User details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {Object.entries(selected).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-gray-800 py-1.5">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="text-gray-200 text-right break-all">{v == null ? "—" : String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
