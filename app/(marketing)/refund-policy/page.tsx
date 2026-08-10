import type { Metadata } from "next";
import { PolicyContent, PolicyBlock } from "@/components/marketing/policy-content";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <PolicyContent title="Refund Policy" updated="1 August 2026">
      <PolicyBlock heading="1. Refund eligibility">
        <p>
          If you are dissatisfied with the platform within the first 14 days of a paid plan, we
          will refund the full amount paid — no questions asked. After 14 days, refunds are issued
          on a pro-rata basis for unused time if the cancellation is due to a service issue on our
          side.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="2. How refunds are processed">
        <p>
          Approved refunds are processed within 7–10 business days to the original payment method.
          You will receive an email confirmation once the refund is initiated.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="3. Non-refundable items">
        <p>
          Custom development work, white-label setup fees, and third-party services (such as SMS or
          WhatsApp credits) are non-refundable once delivered.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="4. Requesting a refund">
        <p>
          Email{" "}
          <a className="text-brand-800 underline" href="mailto:info@skoracares.com">
            info@skoracares.com
          </a>{" "}
          with your account email and reason for the refund request. Our team responds within 2
          business days.
        </p>
      </PolicyBlock>
    </PolicyContent>
  );
}
