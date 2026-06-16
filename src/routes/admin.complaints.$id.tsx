import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, StatusBadge, PriorityBadge } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import * as api from "@/lib/api/client";
import type { Complaint, Status } from "@/lib/api/types";
import { STATUSES } from "@/lib/api/types";
import { ArrowLeft, Paperclip, Archive, Trash2, MessageSquare, UserCog } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/complaints/$id")({
  component: AdminComplaintDetail,
});

function AdminComplaintDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [c, setC] = useState<Complaint | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [noteText, setNoteText] = useState("");
  const [internal, setInternal] = useState(true);

  const load = () => api.getComplaint(id).then((res) => {
    setC(res);
    setAssignedTo(res?.assignedTo ?? "");
  });
  useEffect(() => { load(); }, [id]);

  if (!c) return <AppShell><div className="p-10 text-center text-muted-foreground">Loading…</div></AppShell>;

  const updateStatus = async (s: Status) => {
    await api.updateComplaintStatus(c.id, s);
    toast.success(`Status updated to ${s}. Customer notified via SNS.`);
    load();
  };
  const saveAssignment = async () => {
    if (!assignedTo.trim()) return;
    await api.assignComplaint(c.id, assignedTo.trim());
    toast.success("Assigned");
    load();
  };
  const addNote = async () => {
    if (!noteText.trim()) return;
    await api.addNote(c.id, { text: noteText.trim(), internal });
    setNoteText("");
    toast.success(internal ? "Internal note added" : "Public note added — customer notified");
    load();
  };
  const archive = async () => {
    await api.archiveComplaint(c.id);
    toast.success("Archived");
    navigate({ to: "/admin" });
  };
  const remove = async () => {
    await api.deleteComplaint(c.id);
    toast.success("Deleted");
    navigate({ to: "/admin" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
        </Link>

        <div className="mt-4 grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <code className="text-xs text-muted-foreground">{c.id}</code>
              <h1 className="mt-1 text-2xl font-bold">{c.subject}</h1>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                <span className="text-xs text-muted-foreground">· {c.category}</span>
              </div>
              <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
                <div><div className="text-muted-foreground text-xs">Name</div>{c.name}</div>
                <div><div className="text-muted-foreground text-xs">Email</div>{c.email}</div>
                <div><div className="text-muted-foreground text-xs">Phone</div>{c.phone}</div>
                <div><div className="text-muted-foreground text-xs">Submitted</div>{format(new Date(c.createdAt), "PPp")}</div>
                <div><div className="text-muted-foreground text-xs">Updated</div>{format(new Date(c.updatedAt), "PPp")}</div>
                <div><div className="text-muted-foreground text-xs">Assigned to</div>{c.assignedTo ?? "—"}</div>
              </div>
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-muted-foreground">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm">{c.description}</p>
              </div>
              {c.attachment && (
                <a
                  href={c.attachment.dataUrl}
                  download={c.attachment.name}
                  className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm hover:bg-muted"
                >
                  <Paperclip className="h-3.5 w-3.5" /> {c.attachment.name}
                </a>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Notes & comments</h2>
              <ul className="mt-3 space-y-3">
                {c.notes.length === 0 && <li className="text-sm text-muted-foreground">No notes yet.</li>}
                {c.notes.map((n) => (
                  <li key={n.id} className={`rounded-md border p-3 ${n.internal ? "border-warning/30 bg-warning/5" : "border-border bg-background"}`}>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-medium text-foreground">{n.authorName}</span>
                      · {format(new Date(n.createdAt), "PPp")}
                      {n.internal && <span className="rounded-full bg-warning/15 text-warning px-2 py-0.5 text-[10px] font-medium">INTERNAL</span>}
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{n.text}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2">
                <Textarea
                  value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  rows={3} placeholder="Add a resolution comment or internal note…" maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={internal} onCheckedChange={(v) => setInternal(Boolean(v))} />
                    Internal only (hidden from customer)
                  </label>
                  <Button onClick={addNote} disabled={!noteText.trim()}>Add note</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-semibold">Status</h3>
              <Select value={c.status} onValueChange={(v) => updateStatus(v as Status)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">Customer is notified via SNS on status changes.</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-semibold flex items-center gap-2"><UserCog className="h-4 w-4" /> Assignment</h3>
              <Label htmlFor="assign" className="mt-3 block text-xs text-muted-foreground">Support agent email</Label>
              <Input id="assign" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="agent@company.com" className="mt-1" />
              <Button onClick={saveAssignment} className="w-full mt-2" size="sm">Assign</Button>
            </div>

            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
              <h3 className="font-semibold text-destructive">Danger zone</h3>
              <div className="mt-3 space-y-2">
                <Button onClick={archive} variant="outline" className="w-full" size="sm">
                  <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" size="sm">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this complaint?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes the complaint from DynamoDB. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
