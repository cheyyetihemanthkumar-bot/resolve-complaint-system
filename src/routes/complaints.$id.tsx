import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, StatusBadge, PriorityBadge } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import * as api from "@/lib/api/client";
import type { Complaint } from "@/lib/api/types";
import { ArrowLeft, Paperclip, Download } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/complaints/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Complaint ${params.id} — Resolve` },
      { name: "description", content: `Details and status for complaint ${params.id}.` },
    ],
  }),
  component: ComplaintDetail,
});

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [c, setC] = useState<Complaint | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    api.getComplaint(id).then((res) => {
      if (!res) setNotFound(true);
      else if (res.userId !== user.id && user.role !== "admin") setNotFound(true);
      else setC(res);
    });
  }, [id, user, loading, navigate]);

  if (loading) return null;
  if (notFound) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Complaint not found</h1>
          <Button asChild className="mt-4"><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
      </AppShell>
    );
  }
  if (!c) return null;

  const publicNotes = c.notes.filter((n) => !n.internal);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>

        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <code className="text-xs text-muted-foreground">{c.id}</code>
              <h1 className="mt-1 text-2xl font-bold">{c.subject}</h1>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                <span className="text-xs text-muted-foreground">· {c.category}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <div>Submitted {format(new Date(c.createdAt), "PPp")}</div>
              <div>Updated {format(new Date(c.updatedAt), "PPp")}</div>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
            <div><div className="text-muted-foreground text-xs">Name</div>{c.name}</div>
            <div><div className="text-muted-foreground text-xs">Email</div>{c.email}</div>
            <div><div className="text-muted-foreground text-xs">Phone</div>{c.phone}</div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-muted-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">{c.description}</p>
          </div>

          {c.attachment && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Attachment</h2>
              <a
                href={c.attachment.dataUrl}
                download={c.attachment.name}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm hover:bg-muted"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {c.attachment.name}
                <span className="text-xs text-muted-foreground">({(c.attachment.size / 1024).toFixed(1)} KB)</span>
                <Download className="h-3.5 w-3.5 ml-1" />
              </a>
            </div>
          )}

          {publicNotes.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Updates from support</h2>
              <ul className="mt-2 space-y-3">
                {publicNotes.map((n) => (
                  <li key={n.id} className="rounded-md border border-border bg-background p-3">
                    <div className="text-xs text-muted-foreground">
                      {n.authorName} · {format(new Date(n.createdAt), "PPp")}
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{n.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
