import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Resolve" },
      { name: "description", content: "Answers to common questions before submitting a complaint." },
    ],
  }),
  component: FaqPage,
});

const FAQS = [
  { q: "How quickly will my complaint be reviewed?", a: "Most complaints are reviewed within one business day. High-priority complaints are triaged within a few hours." },
  { q: "How do I track my complaint?", a: "After submitting, you'll receive a unique tracking ID (e.g. CMP-AB12CD). Use it on your dashboard to see the latest status." },
  { q: "Will I be notified when the status changes?", a: "Yes — we send email notifications via Amazon SNS when your complaint is created, assigned, or resolved." },
  { q: "What file types can I attach?", a: "Images (JPG, PNG, WebP), PDFs, and Word documents up to 5 MB per file." },
  { q: "Can I edit a complaint after submitting?", a: "Submitted complaints cannot be edited to preserve the audit trail. You can add a note by replying to the confirmation email." },
  { q: "How long are complaints kept?", a: "Active complaints stay accessible indefinitely. Closed complaints are archived after 12 months but remain searchable by ID." },
  { q: "Is my data secure?", a: "Yes. All API endpoints are protected by Amazon Cognito, every Lambda uses least-privilege IAM roles, and data at rest is encrypted." },
];

function FaqPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-bold">Frequently asked questions</h1>
        <p className="mt-2 text-muted-foreground">
          Browse common questions before submitting — many issues are answered here instantly.
        </p>

        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </AppShell>
  );
}
