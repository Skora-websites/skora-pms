import type { Metadata } from "next";
import { PolicyContent, PolicyBlock } from "@/components/marketing/policy-content";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <PolicyContent title="Privacy Policy" updated="1 August 2026">
      <PolicyBlock heading="1. Information we collect">
        <p>
          SkoraCares collects information you provide directly — such as your name, email address,
          phone number, clinic details, and patient records you upload — as well as technical data
          such as device and usage information when you interact with the platform.
        </p>
        <p>
          Patient medical information is collected strictly for the purpose of providing the
          services you request and is never sold or shared for advertising.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="2. How we use your information">
        <p>We use collected information to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Operate, maintain and improve the SkoraCares platform.</li>
          <li>Process appointments, prescriptions, billing and support requests.</li>
          <li>Send service communications, updates and important notices.</li>
          <li>Comply with legal obligations and protect the security of the platform.</li>
        </ul>
      </PolicyBlock>

      <PolicyBlock heading="3. Data storage and security">
        <p>
          All data is stored on secure servers with encryption in transit and at rest. Access to
          patient records is role-based, so only authorized staff members can view sensitive data.
          We retain data only as long as necessary to provide services or as required by law.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="4. Sharing of information">
        <p>
          We do not sell your personal data. Information is shared only with service providers who
          help operate the platform (e.g. hosting, messaging) under strict data-processing
          agreements, or when required by law.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="5. Your rights">
        <p>
          You may access, correct, export, or request deletion of your personal data at any time by
          contacting us at{" "}
          <a className="text-brand-800 underline" href="mailto:info@skoracares.com">
            info@skoracares.com
          </a>
          . We respond to all verified requests within 30 days.
        </p>
      </PolicyBlock>

      <PolicyBlock heading="6. Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be communicated
          through the platform or by email. Continued use of the services constitutes acceptance of
          the updated policy.
        </p>
      </PolicyBlock>
    </PolicyContent>
  );
}
