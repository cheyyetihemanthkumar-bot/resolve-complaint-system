import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, StatusBadge, PriorityBadge } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import * as api from "@/lib/api/client";
import type { Complaint } from "@/lib/api/types";
import { Plus, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Complaints — Resolve" },
      { name: "description", content: "Track the status of complaints you've submitted." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Complaint[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    api.listMyComplaints().then(setItems);
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My complaints</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and review every complaint you've submitted.</p>
          </div>
          <Button asChild>
            <Link to="/complaints/new"><Plus className="h-4 w-4 mr-1" />New complaint</Link>
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-border p-12 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No complaints yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Submit your first complaint to start tracking.</p>
            <Button asChild className="mt-4">
              <Link to="/complaints/new">Create complaint</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map((c) => (
              <Link
                key={c.id}
                to="/complaints/$id"
                params={{ id: c.id }}
                className="block rounded-xl border border-border bg-card p-4 shadow-card hover:border-primary/50 hover:shadow-elevated transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs text-muted-foreground">{c.id}</code>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      <span className="text-xs text-muted-foreground">· {c.category}</span>
                    </div>
                    <h3 className="mt-2 font-semibold truncate">{c.subject}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
