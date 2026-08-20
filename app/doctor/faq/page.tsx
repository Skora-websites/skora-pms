import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getLandingData } from "@/lib/queries/landing";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { FaqAccordion } from "./faq-accordion";

export const metadata: Metadata = { title: "FAQ · Doctor" };

export default async function DoctorFaqPage() {
  await requireRole(["doctor", "receptionist", "admin"]);
  const landing = await getLandingData();
  const faqSection = landing.get("faq");
  const items = faqSection?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Answers to common questions about the platform"
      />

      {items.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No FAQs yet"
          description="FAQs will appear here once they are published from the admin panel."
        />
      ) : (
        <FaqAccordion
          items={items.map((i) => ({ id: i.id, title: i.title ?? "Question", description: i.description }))}
        />
      )}
    </div>
  );
}