import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, LogOut, Shield, Inbox, Plus, HelpCircle, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const navItem = (to: string, label: string, Icon: typeof Inbox) => {
    const active = pathname === to || (to !== "/" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg">
            <div className="h-7 w-7 rounded-md bg-gradient-hero shadow-elevated" />
            <span>Resolve</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {user && navItem("/dashboard", "My Complaints", Inbox)}
            {user && navItem("/complaints/new", "New", Plus)}
            {isAdmin && navItem("/admin", "Admin", LayoutDashboard)}
            {navItem("/faq", "FAQ", HelpCircle)}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  {isAdmin && <Shield className="h-3.5 w-3.5 text-primary" />}
                  <span className="max-w-[140px] truncate">{user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline ml-1">Sign out</span>
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>Resolve · Serverless Complaint Management</span>
          <span>Powered by AWS Lambda · API Gateway · DynamoDB · S3 · Cognito · SNS</span>
        </div>
      </footer>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-warning/15 text-warning border-warning/30",
    "In Progress": "bg-primary/15 text-primary border-primary/30",
    Resolved: "bg-success/15 text-success border-success/30",
    Closed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Low: "bg-muted text-muted-foreground",
    Medium: "bg-warning/15 text-warning",
    High: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${map[priority]}`}>
      {priority}
    </span>
  );
}
