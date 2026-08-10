import type { Metadata } from "next";
import { PolicyContent, PolicyBlock } from "@/components/marketing/policy-content";

export const metadata: Metadata = { title: "Cancellation Policy" };

export default function CancellationPolicyPage() {
  return (
    <PolicyContent title="Cancellation Policy" updated="1 August 2026">
      <PolicyBlock heading="1. Subscription cancellation">
        <p>
          You may cancel your subscription at any time from your account settings or by contacting
          our support team. Cancellation takes effect at the end of the current billing period —
          you keep full access until then, and no further charges are made.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="2. Appointment cancellations">
        <p>
          Patients may cancel or reschedule appointments through the platform. Clinic-specific
          cancellation windows are configured by the healthcare provider and displayed at the time
          of booking.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="3. How to cancel">
        <p>
          Email us at{" "}
          <a className="text-brand-800 underline" href="mailto:info@skoracares.com">
            info@skoracares.com
          </a>{" "}
          or call our support line with your registered account details, and our team will process
          your cancellation within 2 business days.
        </p>
      </PolicyBlock>
    </PolicyContent>
  );
}
