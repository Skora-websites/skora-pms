import type { Metadata } from "next";
import { PolicyContent, PolicyBlock } from "@/components/marketing/policy-content";

export const metadata: Metadata = { title: "Cancellation Policy" };

export default function CancellationPolicyPage() {
  return (
    <PolicyContent title="Cancellation Policy" updated="1 August 2026">
      <PolicyBlock heading="1. Subscription cancellation">
        <p>
          Plans are one-off purchases, not recurring subscriptions — there is no automatic renewal and
          nothing is charged again unless you buy another plan. You can simply stop when your access
          period ends; you keep full access until the date shown under{" "}
          <a className="text-brand-800 underline" href="/doctor/settings?tab=plan">
            Plan &amp; subscription
          </a>{" "}
          in your account settings, and no further charges are made.
        </p>
        <p>
          Want to end access early, switch plans, or remove an account entirely? Contact our support
          team and we will process it — your patient records, appointments and invoices are retained
          regardless.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="2. Appointment cancellations">
        <p>
          Patients may cancel or reschedule appointments through the platform. Clinic-specific
          cancellation windows are configured by the healthcare provider and displayed at the time
          of booking.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="3. How to cancel or change plan">
        <p>
          Email us at{" "}
          <a className="text-brand-800 underline" href="mailto:info@skoracares.com">
            info@skoracares.com
          </a>{" "}
          or call our support line with your registered account details, and our team will process
          your request within 2 business days. Plan changes and renewals can also be completed
          directly from{" "}
          <a className="text-brand-800 underline" href="/doctor/settings?tab=plan">
            Plan &amp; subscription
          </a>{" "}
          in your account settings.
        </p>
      </PolicyBlock>
    </PolicyContent>
  );
}
