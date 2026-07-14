import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, RefreshCw, Shield, LayoutDashboard, Users, Landmark, Bitcoin, LifeBuoy, MessagesSquare, ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


type Stats = {
  totalUsers: number;
  active7d: number;
  pending: number;
  paidUsdc: number;
  approved: number;
  rejected: number;
  banned: number;
  upgrades: number;
};

type Ctx = { stats: Stats; refresh: () => Promise<void>; loading: boolean };
const AdminCtx = createContext<Ctx>({
  stats: { totalUsers: 0, active7d: 0, pending: 0, paidUsdc: 0, approved: 0, rejected: 0, banned: 0, upgrades: 0 },
  refresh: async () => {},
  loading: false,
});
export const useAdmin = () => useContext(AdminCtx);

export function AdminLayout({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, active7d: 0, pending: 0, paidUsdc: 0, approved: 0, rejected: 0, banned: 0, upgrades: 0,
  });
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setLoading(true);
    const since7d = new Date(Date.now() - 7 * 864e5).toISOString();
    const [users, active, pendingP, pendingW, pendingU, paid, approved, rejected, banned, upgradesAll] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", since7d),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("upgrades").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payments").select("amount").eq("status", "approved"),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("user_bans").select("*", { count: "exact", head: true }),
      supabase.from("upgrades").select("*", { count: "exact", head: true }),
    ]);
    const paidSum = (paid.data ?? []).reduce((s, r: { amount: number | string }) => s + Number(r.amount || 0), 0);
    setStats({
      totalUsers: users.count ?? 0,
      active7d: active.count ?? 0,
      pending: (pendingP.count ?? 0) + (pendingW.count ?? 0) + (pendingU.count ?? 0),
      paidUsdc: paidSum,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
      banned: banned.count ?? 0,
      upgrades: upgradesAll.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return navigate({ to: "/admin/login" });
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      if (!isAdmin) return navigate({ to: "/admin/login" });
      setChecking(false);
      await refresh();
    })();
  }, [navigate, refresh]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 bg-gradient-to-b from-sky-100 to-sky-200">
        Checking admin access…
      </div>
    );
  }

  return (
    <AdminCtx.Provider value={{ stats, refresh, loading }}>
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-100 to-sky-200 text-slate-900">
        <header className="px-5 pt-6 pb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight truncate">Admin Panel</h1>
              <p className="text-xs text-slate-500 truncate">FastCredit control center</p>
            </div>

          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refresh}
              className="h-10 w-10 rounded-full bg-white/70 backdrop-blur border border-white flex items-center justify-center shadow-sm hover:bg-white"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }}
              className="h-10 px-4 rounded-full bg-white/70 backdrop-blur border border-white flex items-center gap-2 shadow-sm text-sm font-medium text-slate-700 hover:bg-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </header>
        <AdminNav />
        <main className="px-5 pb-10">{children}</main>

      </div>
    </AdminCtx.Provider>
  );
}

function AdminNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/bank-details", label: "Banks", icon: Landmark },
    { to: "/admin/crypto-wallets", label: "Wallets", icon: Bitcoin },
    { to: "/admin/support-settings", label: "Support", icon: LifeBuoy },
    { to: "/admin/community", label: "Community", icon: MessagesSquare },
    { to: "/admin/legal-settings", label: "Legal", icon: ScrollText },
  ] as const;
  return (
    <nav className="px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
      {items.map((it) => {
        const active = path === it.to;
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              active
                ? "bg-blue-600 text-white border-blue-600 shadow"
                : "bg-white/70 backdrop-blur border-white text-slate-600 hover:bg-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

