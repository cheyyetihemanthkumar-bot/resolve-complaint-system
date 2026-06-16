import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthContext";
import * as api from "@/lib/api/client";
import { CATEGORIES, PRIORITIES, type Category, type Priority } from "@/lib/api/types";
import { toast } from "sonner";
import { z } from "zod";
import { Paperclip, X } from "lucide-react";

export const Route = createFileRoute("/complaints/new")({
  head: () => ({
    meta: [
      { title: "New complaint — Resolve" },
      { name: "description", content: "Submit a new complaint and get a tracking ID instantly." },
    ],
  }),
  component: NewComplaintPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name too short").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(5, "Enter a valid phone").max(40),
  subject: z.string().trim().min(5, "Subject too short").max(120),
  description: z.string().trim().min(20, "Tell us a bit more (20+ chars)").max(2000),
});

const MAX_FILE = 5 * 1024 * 1024; // 5 MB

function NewComplaintPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("Billing");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const handleFile = (f: File | null) => {
    if (!f) { setFile(null); return; }
    if (f.size > MAX_FILE) { toast.error("Max file size is 5 MB"); return; }
    setFile(f);
  };

  const fileToDataUrl = (f: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(fd);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      let attachment = undefined;
      if (file) {
        const dataUrl = await fileToDataUrl(file);
        attachment = { name: file.name, size: file.size, type: file.type, dataUrl };
      }
      const c = await api.createComplaint({
        ...parsed.data, category, priority, attachment,
      });
      toast.success(`Complaint ${c.id} submitted. A confirmation email was sent.`);
      navigate({ to: "/complaints/$id", params: { id: c.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold">Submit a complaint</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You'll get a unique tracking ID and an email confirmation.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required defaultValue={user.name} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required defaultValue={user.email} maxLength={255} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required placeholder="+1 555 123 4567" maxLength={40} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required placeholder="Short summary" maxLength={120} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required rows={6} maxLength={2000} placeholder="Describe the issue with as much detail as possible…" />
          </div>
          <div>
            <Label>Priority</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    priority === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Attachment (optional, max 5 MB)</Label>
            {file ? (
              <div className="mt-1.5 flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="truncate flex items-center gap-2"><Paperclip className="h-3.5 w-3.5" /> {file.name}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => setFile(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="mt-1.5"
              />
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit complaint"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
