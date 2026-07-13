import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Users, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AdminCtx = { totalUsers: number; refresh: () => Promise<void> };
const Ctx = createContext<AdminCtx>({ totalUsers: 0, refresh: async () => {} });
export const useAdmin = () => useContext(Ctx);

export function AdminLayout({ children }: { children: ReactNode }) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const refresh = async () => {
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    if (typeof count === "number") setTotalUsers(count);
  };

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        navigate({ to: "/admin/login" });
        return;
      }
      setChecking(false);
      await refresh();
    })();
  }, [navigate]);

  useEffect(() => {
    if (checking) return;
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [checking]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Checking admin access…
      </div>
    );
  }

  const nav = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <Ctx.Provider value={{ totalUsers, refresh }}>
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-50 flex items-center justify-between">
          <div className="text-xl font-bold">Admin Panel</div>
          <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-1.5 rounded-lg">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-gray-300">Total Users:</span>
            <span className="text-sm font-bold text-white">{totalUsers}</span>
          </div>
        </header>
        <div className="flex flex-1">
          <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4">
            <div className="bg-blue-600 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-100">
                <Users className="h-5 w-5" />
                <span className="text-xs uppercase tracking-wide">Total Users</span>
              </div>
              <div className="mt-2 text-4xl font-black text-white">{totalUsers}</div>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      active ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50"
                    }`}
                  >
                    <n.icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/admin/login" });
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800/50 mt-4"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </nav>
          </aside>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  );
}
