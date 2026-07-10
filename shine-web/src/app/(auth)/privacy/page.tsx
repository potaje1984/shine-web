"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/register">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Register
          </Button>
        </Link>

        <article className="prose prose-invert prose-sm max-w-none">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: July 9, 2026</p>

          <p>
            Shine (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our website, mobile application, and related services (the &quot;Service&quot;). This
            policy complies with the New Jersey Name Disclosure Law (N.J.S.A. 56:11-44 et seq.), the
            New Jersey Consumer Fraud Act (N.J.S.A. 56:8-1 et seq.), and other applicable privacy laws.
          </p>

          <h2>1. Information We Collect</h2>
          <p><strong>1.1 Information You Provide:</strong></p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, phone number, and delivery address when you create an account.</li>
            <li><strong>Payment Information:</strong> Credit/debit card details are processed by Stripe, Inc. and are never stored on our servers. We retain a Stripe payment method token for future transactions only with your consent.</li>
            <li><strong>Order Information:</strong> Service type, weight, preferences, special instructions, and order history.</li>
            <li><strong>Communications:</strong> Any messages, feedback, or support requests you send to us.</li>
          </ul>
          <p><strong>1.2 Information Collected Automatically:</strong></p>
          <ul>
            <li><strong>Device and Usage Data:</strong> IP address, browser type, operating system, device identifiers, pages visited, and interaction patterns.</li>
            <li><strong>Location Data:</strong> With your consent, we may collect GPS coordinates for delivery verification purposes only.</li>
            <li><strong>Cookies and Similar Technologies:</strong> We use essential cookies for authentication and analytics cookies to improve our Service.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your personal information to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service;</li>
            <li>Process orders, payments, and delivery logistics;</li>
            <li>Communicate with you about orders, updates, and customer support;</li>
            <li>Send service-related notifications (order status, delivery confirmations, receipts);</li>
            <li>Improve and personalize your experience;</li>
            <li>Detect, prevent, and address fraud, security issues, and abuse;</li>
            <li>Comply with legal obligations under New Jersey and federal law.</li>
          </ul>
          <p>
            We do NOT sell your personal information to third parties. Under the New Jersey Name Disclosure Law,
            we disclose that we collect personal information from users of our online service and that such
            information may be disclosed as described in this policy.
          </p>

          <h2>3. Information Sharing and Disclosure</h2>
          <p>We may share your information with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Stripe (payment processing), Google (maps/geocoding), Firebase/Google Cloud (data storage), and Resend (email delivery). These providers are contractually obligated to protect your data.</li>
            <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, court order, subpoena, or governmental authority under New Jersey or federal law.</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction, subject to continued protection under this policy.</li>
            <li><strong>With Your Consent:</strong> We may share information with third parties when you have given us explicit consent to do so.</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information, including
            encryption in transit (TLS/SSL), encrypted data storage via Firebase, secure authentication via
            Firebase Auth, and access controls. However, no method of transmission over the Internet or
            electronic storage is 100% secure. We cannot guarantee absolute security and are not responsible
            for unauthorized access by third parties who defeat our security measures.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide
            you services, comply with legal obligations, resolve disputes, and enforce our agreements. Order
            records and financial data are retained for a minimum of 7 years in compliance with New Jersey
            and federal tax record-keeping requirements. You may request deletion of your account and
            non-essential data at any time by contacting support@shinecleann.com.
          </p>

          <h2>6. Your Rights Under New Jersey Law</h2>
          <p>
            Under applicable New Jersey and federal laws, you have the right to:
          </p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you;</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete personal information;</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements;</li>
            <li><strong>Data Portability:</strong> Request your data in a structured, commonly used format;</li>
            <li><strong>Opt-Out:</strong> Opt out of non-essential communications by updating your preferences or contacting us;</li>
            <li><strong>Non-Discrimination:</strong> Exercise your privacy rights without being denied services or receiving different treatment.</li>
          </ul>
          <p>
            To exercise these rights, contact us at support@shinecleann.com. We will respond within 30 days
            as required by applicable law.
          </p>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for individuals under the age of 18. We do not knowingly collect
            personal information from children. If we become aware that we have collected information from
            a child under 18, we will take steps to delete that information promptly.
          </p>

          <h2>8. Location Data</h2>
          <p>
            When our delivery personnel confirm a delivery, GPS coordinates may be collected to verify that
            the delivery was made at the correct address. This location data is used solely for delivery
            verification and fraud prevention. It is not used for tracking purposes beyond what is necessary
            for the specific order. Location data is retained with the associated order record.
          </p>

          <h2>9. Third-Party Links</h2>
          <p>
            Our Service may contain links to third-party websites or services. We are not responsible for
            the privacy practices of these third parties. We encourage you to review their privacy policies
            before providing any personal information.
          </p>

          <h2>10. California Residents (CCPA)</h2>
          <p>
            Although Shine operates primarily under New Jersey law, if you are a California resident, you
            may have additional rights under the California Consumer Privacy Act (CCPA), including the right
            to know, delete, and opt-out of the sale of personal information. We do not sell personal
            information. To exercise CCPA rights, contact us at support@shinecleann.com.
          </p>

          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be communicated via
            email or a prominent notice on our website. Your continued use of the Service after changes are
            posted constitutes acceptance of the updated policy.
          </p>

          <h2>12. Contact Information</h2>
          <p>For privacy-related inquiries, contact us at:</p>
          <ul>
            <li><strong>Email:</strong> support@shinecleann.com</li>
            <li><strong>Website:</strong> shinecleann.com</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-8">
            This Privacy Policy has been prepared in compliance with New Jersey State Law, including the
            New Jersey Name Disclosure Law (N.J.S.A. 56:11-44 et seq.) and the New Jersey Consumer Fraud
            Act (N.J.S.A. 56:8-1 et seq.). It is not intended as legal advice.
          </p>
        </article>
      </div>
    </div>
  );
}