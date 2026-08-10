import type { Metadata } from "next";
import { PolicyContent, PolicyBlock } from "@/components/marketing/policy-content";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <PolicyContent title="Terms & Conditions" updated="1 August 2026">
      <PolicyBlock heading="1. Acceptance of terms">
        <p>
          By creating an account or using the SkoraCares platform, you agree to these Terms &
          Conditions. If you are using the platform on behalf of a clinic or organization, you
          confirm that you have authority to bind that entity.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="2. Accounts and eligibility">
        <p>
          You must provide accurate information when creating an account and keep your credentials
          confidential. You are responsible for all activity under your account. The platform is
          intended for licensed healthcare professionals and their staff.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="3. Acceptable use">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Do not use the platform for unlawful purposes or to store unlawful content.</li>
          <li>Do not attempt to access other users&apos; data or break the platform&apos;s security.</li>
          <li>Do not resell or sublicense access without written permission.</li>
        </ul>
      </PolicyBlock>

      <PolicyBlock heading="4. Subscriptions and payments">
        <p>
          Paid plans are billed monthly or annually as selected at checkout. Plans renew
          automatically unless cancelled before the renewal date. Prices are exclusive of
          applicable taxes. We may change pricing with at least 30 days&apos; notice.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="5. Intellectual property">
        <p>
          The platform, its design, and its software are owned by SkoraCares and its licensors. You
          retain full ownership of the data you enter into the platform.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="6. Limitation of liability">
        <p>
          The platform is provided &quot;as is&quot; without warranties of any kind. To the maximum extent
          permitted by law, SkoraCares shall not be liable for indirect, incidental, or
          consequential damages arising from your use of the platform.
        </p>
      </PolicyBlock>
    </PolicyContent>
  );
}
