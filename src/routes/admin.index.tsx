import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, StatusBadge, PriorityBadge } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as api from "@/lib/api/client";
import type { Complaint, Status, Priority, Category } from "@/lib/api/types";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/api/types";
import { Search, Download } from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const STATUS_COLORS: Record<Status, string> = {
  Pending: "var(--color-warning)",
  "In Progress": "var(--color-primary)",
  Resolved: "var(--color-success)",
  Closed: "var(--color-muted-foreground)",
};

function AdminDashboard() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const refresh = () => api.listAllComplaints().then(setItems);
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
      if (!ql) return true;
      return (
        c.id.toLowerCase().includes(ql) ||
        c.subject.toLowerCase().includes(ql) ||
        c.email.toLowerCase().includes(ql) ||
        c.name.toLowerCase().includes(ql)
      );
    });
  }, [items, q, statusFilter, categoryFilter, priorityFilter]);

  const counts = useMemo(() => ({
    total: items.length,
    pending: items.filter((c) => c.status === "Pending").length,
    inProgress: items.filter((c) => c.status === "In Progress").length,
    resolved: items.filter((c) => c.status === "Resolved").length,
  }), [items]);

  const statusData = useMemo(() =>
    STATUSES.map((s) => ({ name: s, value: items.filter((c) => c.status === s).length })),
  [items]);

  const categoryData = useMemo(() =>
    CATEGORIES.map((cat) => ({ name: cat, value: items.filter((c) => c.category === cat).length })),
  [items]);

  const exportCsv = () => {
    const headers = ["id","name","email","phone","category","priority","status","subject","createdAt","updatedAt"];
    const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((c) =>
      [c.id, c.name, c.email, c.phone, c.category, c.priority, c.status, c.subject, c.createdAt, c.updatedAt]
        .map(escape).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaints-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Admin dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Triage, assign, and resolve every complaint.</p>
          </div>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> Export CSV ({filtered.length})
          </Button>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Total", v: counts.total, c: "text-foreground" },
            { l: "Pending", v: counts.pending, c: "text-warning" },
            { l: "In Progress", v: counts.inProgress, c: "text-primary" },
            { l: "Resolved", v: counts.resolved, c: "text-success" },
          ].map((k) => (
            <div key={k.l} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="text-xs text-muted-foreground">{k.l}</div>
              <div className={`mt-1 text-3xl font-bold font-display ${k.c}`}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold">Complaints by category</h3>
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold">Status distribution</h3>
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45}>
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={STATUS_COLORS[d.name as Status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, name, email, subject…" className="pl-9" />
          </div>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} placeholder="All statuses" options={STATUSES} />
          <FilterSelect value={categoryFilter} onChange={setCategoryFilter} placeholder="All categories" options={CATEGORIES} />
          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} placeholder="All priorities" options={PRIORITIES} />
        </div>

        {/* Table */}
        <div className="mt-4 rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5">ID</th>
                  <th className="text-left px-4 py-2.5">Subject</th>
                  <th className="text-left px-4 py-2.5">Customer</th>
                  <th className="text-left px-4 py-2.5">Category</th>
                  <th className="text-left px-4 py-2.5">Priority</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No complaints match these filters.</td></tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to="/admin/complaints/$id" params={{ id: c.id }} className="font-mono text-xs hover:text-primary">
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{c.subject}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.createdAt), "MMM d, HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FilterSelect({
  value, onChange, placeholder, options,
}: { value: string; onChange: (v: string) => void; placeholder: string; options: readonly string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
