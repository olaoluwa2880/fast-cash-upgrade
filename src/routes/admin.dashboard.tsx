import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout, useAdmin } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/dashboard")({
  component: () => (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  ),
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

function Dashboard() {
  const { totalUsers } = useAdmin();
  const [today, setToday] = useState(0);
  const [active30, setActive30] = useState(0);
  const [chart, setChart] = useState<{ date: string; count: number }[]>([]);
  const [recent, setRecent] = useState<Profile[]>([]);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [{ count: c1 }, { count: c2 }, { data: recentRows }, { data: rangeRows }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startToday),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", start30),
          supabase.from("profiles").select("id,full_name,email,created_at").order("created_at", { ascending: false }).limit(10),
          supabase.from("profiles").select("created_at").gte("created_at", start30),
        ]);

      setToday(c1 ?? 0);
      setActive30(c2 ?? 0);
      setRecent(recentRows ?? []);

      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }
      (rangeRows ?? []).forEach((r) => {
        const k = new Date(r.created_at).toISOString().slice(0, 10);
        if (k in buckets) buckets[k]++;
      });
      setChart(Object.entries(buckets).map(([date, count]) => ({ date: date.slice(5), count })));
    })();
  }, []);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Today's Signups", value: today, icon: UserPlus, color: "text-emerald-400" },
    { label: "Active (30d)", value: active30, icon: Activity, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="text-sm text-gray-400 mb-3">Registrations — Last 30 days</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1f2937" }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="text-sm text-gray-400 mb-3">Recent Users</div>
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-left">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Registered</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((u) => (
              <tr key={u.id} className="border-t border-gray-800">
                <td className="py-2">{u.full_name ?? "—"}</td>
                <td className="py-2 text-gray-300">{u.email ?? "—"}</td>
                <td className="py-2 text-gray-400">{new Date(u.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-500">
                  No users yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
