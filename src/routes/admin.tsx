import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AppShell } from "@/components/Layout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Resolve" },
      { name: "description", content: "Internal admin dashboard for complaint management." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!isAdmin) { navigate({ to: "/dashboard" }); return; }
  }, [user, loading, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <AppShell><div className="p-10 text-center text-muted-foreground">Loading…</div></AppShell>;
  }
  return <Outlet />;
}
