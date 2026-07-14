import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    // Enforce account suspension
    const { data: ban } = await supabase
      .from("user_bans")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (ban) {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") window.location.replace("/auth?suspended=1");
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
