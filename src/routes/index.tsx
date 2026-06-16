import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Clock, BarChart3, Cloud, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resolve — Submit & track complaints in minutes" },
      { name: "description", content: "A fully serverless complaint management platform built on AWS Lambda, API Gateway, DynamoDB, S3, Cognito, and SNS." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-24 sm:pt-32 sm:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Cloud className="h-3.5 w-3.5 text-primary" />
              Serverless · AWS Lambda · DynamoDB · Cognito
            </div>
            <h1 className="mt-6 text-5xl sm:text-7xl font-bold tracking-tight text-balance">
              Complaints, <span className="bg-gradient-hero bg-clip-text text-transparent">resolved.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl text-balance">
              Submit, track, and close out complaints with a fully serverless platform.
              Real-time status, email notifications, and a dashboard your support team will actually use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/faq">Browse FAQ</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Demo logins: <code className="px-1 rounded bg-muted">demo@user.com</code> / <code className="px-1 rounded bg-muted">demo1234</code>
              {" "}·{" "}
              <code className="px-1 rounded bg-muted">admin@company.com</code> / <code className="px-1 rounded bg-muted">admin1234</code>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { i: Zap, t: "Instant complaint IDs", d: "Every submission gets a tracking ID the moment you hit send." },
            { i: Clock, t: "Real-time status", d: "Pending → In Progress → Resolved. Watch progress as it happens." },
            { i: Shield, t: "Cognito auth", d: "Hosted authentication with secure token-based access to every endpoint." },
            { i: BarChart3, t: "Admin analytics", d: "Trends by category, priority, and status — straight from DynamoDB." },
            { i: Cloud, t: "S3 attachments", d: "Securely upload screenshots, receipts, or PDFs alongside your complaint." },
            { i: Lock, t: "Least-privilege IAM", d: "Each Lambda has scoped permissions. No standing access, no shared roles." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="rounded-2xl border border-border bg-gradient-surface p-8 shadow-card">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold">Built fully serverless.</h2>
              <p className="mt-3 text-muted-foreground">
                Zero servers, zero patching. Pay only for the requests you serve.
                Source code and a SAM template ship in <code className="text-foreground">/backend</code>.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  ["API Gateway", "REST endpoints with Cognito authorizer"],
                  ["AWS Lambda (Python 3.12)", "Business logic, validation, notifications"],
                  ["DynamoDB", "Single-table complaint store with GSIs"],
                  ["Amazon S3", "Attachment storage with signed URLs"],
                  ["Amazon SNS", "Email notifications on create / update"],
                  ["CloudWatch", "Structured logs and dashboards"],
                ].map(([k, v]) => (
                  <li key={k} className="flex gap-3">
                    <span className="font-medium w-44 shrink-0">{k}</span>
                    <span className="text-muted-foreground">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <pre className="text-xs leading-relaxed rounded-lg bg-background/60 border border-border p-4 overflow-x-auto font-mono">
{`     Browser
        │
        ▼
  ┌──────────────┐
  │ API Gateway  │──► Cognito User Pool (JWT)
  └──────┬───────┘
         ▼
  ┌──────────────┐      ┌────────────┐
  │   Lambda     │─────►│ DynamoDB   │
  │ (Python 3.12)│      └────────────┘
  └──┬───────┬───┘      ┌────────────┐
     │       └────────► │  S3 bucket │
     ▼                  └────────────┘
   SNS Topic ──► email subscribers
     │
     ▼
  CloudWatch Logs & Metrics`}
            </pre>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
