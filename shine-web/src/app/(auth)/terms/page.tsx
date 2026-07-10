"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
          <h1 className="text-2xl font-bold">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Last updated: July 9, 2026</p>

          <p>
            Welcome to Shine (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). These Terms of Service
            (&quot;Terms&quot;) govern your use of the Shine website, mobile application, and related services
            (collectively, the &quot;Service&quot;) operated by Shine. By creating an account or using our Service,
            you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating an account, you confirm that you are at least 18 years of age and have the legal
            capacity to enter into a binding agreement under the laws of the State of New Jersey. You represent
            that all information you provide is accurate and current. These Terms constitute a legally binding
            agreement between you and Shine, governed exclusively by the laws of the State of New Jersey
            without regard to its conflict-of-law principles.
          </p>

          <h2>2. Description of Services</h2>
          <p>
            Shine provides on-demand laundry and cleaning services including, but not limited to, wash &amp; fold,
            dry cleaning, and house cleaning. Services are provided within the State of New Jersey and surrounding
            areas. Shine acts as an independent service provider and reserves the right to modify, suspend, or
            discontinue any aspect of the Service at any time with reasonable notice.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account. You must notify Shine immediately of any unauthorized use
            of your account. Shine shall not be liable for any loss or damage arising from your failure to
            protect your account. You may not transfer your account to another person without written consent
            from Shine.
          </p>

          <h2>4. Orders and Service Agreements</h2>
          <p>
            When you place an order through the Service, you are entering into a service agreement with Shine.
            All orders are subject to acceptance by Shine. Prices are estimates based on the information you
            provide; actual charges may vary based on confirmed weight (for laundry) or assessed scope (for
            cleaning). In the event of a price adjustment, Shine will notify you before proceeding with the
            service. By confirming an order, you authorize Shine to access your designated pickup location
            and to perform the requested services.
          </p>

          <h2>5. Payment Terms</h2>
          <p>
            Payment is due upon delivery for cash orders or at the time of service completion for card orders.
            Shine accepts cash and major credit/debit cards processed through Stripe, Inc. All card payments
            are subject to Stripe&apos;s terms. You agree to pay all charges incurred under your account. Shine
            reserves the right to charge a fee for returned payments, chargebacks, or insufficient funds.
            Prices are listed in US Dollars and include applicable service fees. Taxes are calculated
            separately where required by New Jersey law.
          </p>

          <h2>6. Cancellation and Refund Policy</h2>
          <p>
            You may cancel an order at no charge if the cancellation is made at least 2 hours before the
            scheduled pickup time. Cancellations made within 2 hours of pickup may incur a cancellation fee
            of up to $15.00. Once service has commenced (e.g., items have been picked up or cleaning has
            begun), no refund will be issued for the completed portion of the service. Refund requests must
            be submitted within 48 hours of delivery and are evaluated on a case-by-case basis. Shine
            reserves the right to issue refunds at its sole discretion.
          </p>

          <h2>7. Liability for Personal Property</h2>
          <p>
            <strong>IMPORTANT — PLEASE READ CAREFULLY.</strong> Shine exercises reasonable care in handling
            your belongings. However, you acknowledge and agree that:
          </p>
          <ul>
            <li>
              Shine&apos;s maximum liability for any damage to, loss of, or destruction of personal property
              shall not exceed ten (10) times the amount charged for the specific service that gave rise
              to the claim, or one hundred dollars ($100.00), whichever is less.
            </li>
            <li>
              Shine is NOT liable for damage or loss caused by: (a) pre-existing conditions, wear and tear,
              or inherent defects in items; (b) items left in pockets, concealed compartments, or attached
              accessories; (c) color bleeding, shrinkage, or other effects resulting from the manufacturing
              process of garments; (d) loss or damage to cash, jewelry, electronics, or other valuables.
            </li>
            <li>
              All damage or loss claims must be reported within 24 hours of delivery. Failure to report
              within this period constitutes a waiver of your claim.
            </li>
          </ul>
          <p>
            These limitations of liability are consistent with the New Jersey Consumer Fraud Act
            (N.J.S.A. 56:8-1 et seq.) and applicable industry standards.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY NEW JERSEY LAW, SHINE SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
            PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
            SHINE&apos;S TOTAL CUMULATIVE LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID TO SHINE
            IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
          </p>
          <p>
            This limitation applies regardless of the legal theory on which the claim is based, whether in
            contract, tort (including negligence), strict liability, or any other theory, even if Shine has
            been advised of the possibility of such damages.
          </p>

          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Shine, its officers, directors, employees,
            agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs,
            and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your use
            of the Service; (b) your breach of these Terms; (c) your violation of any law or regulation;
            or (d) any content you submit through the Service.
          </p>

          <h2>10. Privacy</h2>
          <p>
            Your privacy is important to us. Shine&apos;s collection and use of personal information is governed
            by our Privacy Policy, which is incorporated herein by reference. By using the Service, you
            consent to the collection and use of your information as described in the Privacy Policy, in
            compliance with the New Jersey Name Disclosure Law (N.J.S.A. 56:11-44 et seq.) and other
            applicable privacy laws.
          </p>

          <h2>11. Access to Property</h2>
          <p>
            For services performed at your home or designated location, you grant Shine and its employees
            or agents a limited license to enter your property for the sole purpose of performing the
            requested services. You represent that you have the authority to grant such access. Shine is
            not responsible for any pre-existing damage to your property. If no one is present at the time
            of service, you assume all risk associated with Shine&apos;s access to your property.
          </p>

          <h2>12. Prohibited Conduct</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose under New Jersey or federal law;</li>
            <li>Submit false, misleading, or fraudulent orders or information;</li>
            <li>Attempt to reverse engineer, hack, or disrupt the Service;</li>
            <li>Harass, threaten, or endanger Shine employees or agents;</li>
            <li>Include prohibited items (hazardous materials, illegal substances, weapons, etc.) in laundry or cleaning orders.</li>
          </ul>
          <p>
            Shine reserves the right to refuse service, terminate accounts, and pursue legal remedies for
            violations of this section, including under the New Jersey Law Against Discrimination
            (N.J.S.A. 10:5-1 et seq.) and applicable criminal statutes.
          </p>

          <h2>13. Dispute Resolution and Governing Law</h2>
          <p>
            <strong>13.1 Governing Law.</strong> These Terms and any disputes arising out of or related to the
            Service shall be governed by and construed in accordance with the laws of the State of New Jersey,
            without regard to its conflict-of-law provisions.
          </p>
          <p>
            <strong>13.2 Informal Resolution.</strong> Before filing any legal claim, you agree to first
            contact Shine at support@shinecleann.com to attempt to resolve the dispute informally. Shine
            will attempt to respond within 15 business days.
          </p>
          <p>
            <strong>13.3 Arbitration.</strong> If the dispute cannot be resolved informally within 30 days,
            you and Shine agree to submit the dispute to binding arbitration administered by the American
            Arbitration Association (&quot;AAA&quot;) under its Consumer Arbitration Rules. The arbitration will be
            conducted in Union County, New Jersey, or at another mutually agreed location. The arbitrator
            may award any relief that a court of competent jurisdiction could award, including injunctive
            relief. The arbitrator&apos;s decision shall be final and binding, and judgment may be entered in
            any court of competent jurisdiction.
          </p>
          <p>
            <strong>13.4 Class Action Waiver.</strong> YOU AND SHINE AGREE THAT ANY DISPUTE RESOLUTION
            PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR
            REPRESENTATIVE ACTION. This waiver applies to class arbitration as well. If a court or arbitrator
            determines that this waiver is unenforceable under the New Jersey Arbitration Act (N.J.S.A. 2A:23B-1
            et seq.) or the Federal Arbitration Act, the affected provision shall be severed and the
            remaining provisions shall remain in effect.
          </p>

          <h2>14. Modifications to Terms</h2>
          <p>
            Shine reserves the right to modify these Terms at any time. Material changes will be communicated
            via email or a prominent notice on the Service. Your continued use of the Service after such
            changes constitutes acceptance of the modified Terms.
          </p>

          <h2>15. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid under New Jersey law, that
            provision shall be limited or eliminated to the minimum extent necessary so that the remaining
            provisions remain in full force and effect.
          </p>

          <h2>16. Entire Agreement</h2>
          <p>
            These Terms, together with the Privacy Policy, constitute the entire agreement between you and
            Shine regarding the Service and supersede all prior or contemporaneous agreements.
          </p>

          <h2>17. Contact Information</h2>
          <p>For questions about these Terms, contact us at:</p>
          <ul>
            <li><strong>Email:</strong> support@shinecleann.com</li>
            <li><strong>Website:</strong> shinecleann.com</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-8">
            These Terms of Service have been prepared in compliance with the laws of the State of New Jersey.
            They are not intended as legal advice. If you have questions about your rights, please consult an
            attorney licensed in New Jersey.
          </p>
        </article>
      </div>
    </div>
  );
}