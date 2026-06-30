import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using Pointsy, the free family points app operated by Highfivery LLC.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>Terms of Service</h1>
      <div className={styles.body}>
        <p className={styles.effective}>Effective June 30, 2026</p>

        <p>
          These Terms govern your use of <strong>Pointsy</strong> (the
          &ldquo;Service&rdquo;), the hosted family points app at{" "}
          <Link href="/">pointsy.kids</Link>, operated by{" "}
          <strong>Highfivery LLC</strong> (&ldquo;Highfivery,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;), a Texas, USA limited liability
          company. By creating an account or using the Service, you agree to
          these Terms. If you don&rsquo;t agree, please don&rsquo;t use Pointsy.
        </p>

        <h2>Who can use Pointsy</h2>
        <p>
          You must be at least 18 years old and a parent or legal guardian to
          create an account. You are responsible for the family, child profiles,
          and any co-parents you add, and for ensuring you have the right to
          create and manage those child profiles.
        </p>

        <h2>Your account</h2>
        <p>
          Keep your password and your family&rsquo;s PINs secure; you&rsquo;re
          responsible for activity under your account. Pointsy sends no email,
          so there is no email-based password reset — if you lose access,
          contact us at{" "}
          <a href="mailto:info@highfivery.com">info@highfivery.com</a>. You can
          manage your family&rsquo;s profiles, export your data, and delete your
          family — closing your account — from within the app, or by emailing
          us.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Use Pointsy lawfully and only to manage your own family&rsquo;s
          points, chores, and rewards. Don&rsquo;t misuse the Service — for
          example, by attempting to access other families&rsquo; data, probing
          or breaching security, disrupting the Service, or using it to collect
          information about children other than your own.
        </p>

        <h2>A free service</h2>
        <p>
          Pointsy is free: there are no fees, subscriptions, or in-app
          purchases, and every feature is included for every family. We provide
          it as a free service and may add, change, or discontinue features over
          time.
        </p>

        <h2>Open-source software</h2>
        <p>
          The Pointsy software is open source and available under the MIT
          License on{" "}
          <a
            href="https://github.com/Highfivery/Pointsy"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          . You&rsquo;re welcome to fork, self-host, or contribute to it under
          that license. These Terms apply only to the hosted service we operate
          at pointsy.kids — they do not govern your own self-hosted copy.
        </p>

        <h2>Your data</h2>
        <p>
          Your family&rsquo;s data is yours. You grant us only the permissions
          needed to store and process it to run the Service for you. How we
          handle data is described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>, which is part of these
          Terms.
        </p>

        <h2>Disclaimers</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as
          available,&rdquo; without warranties of any kind, whether express or
          implied. We don&rsquo;t guarantee that the Service will be
          uninterrupted, error-free, or that points or data will never be lost.
          Pointsy is a tool to help families — it is not a substitute for your
          own judgment as a parent or guardian.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Highfivery and its members
          will not be liable for any indirect, incidental, special, or
          consequential damages, or for any loss of data, arising from your use
          of the Service. Because Pointsy is provided free of charge, our total
          liability to you for any claim is limited to USD $100.
        </p>

        <h2>Termination</h2>
        <p>
          You can stop using Pointsy at any time and delete your family and its
          data from your dashboard. We may suspend or terminate access if you
          violate these Terms or to protect the Service or its users.
        </p>

        <h2>Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material
          changes, we&rsquo;ll update the effective date above and, where
          appropriate, note the change in the app. Continued use of Pointsy
          after a change means you accept the updated Terms.
        </p>

        <h2>Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Texas, USA,
          without regard to its conflict-of-laws rules. Any disputes will be
          subject to the exclusive jurisdiction of the state and federal courts
          located in Texas.
        </p>

        <h2>Contact us</h2>
        <p>
          Highfivery LLC — Texas, USA.
          <br />
          Email: <a href="mailto:info@highfivery.com">info@highfivery.com</a>.
        </p>
      </div>
    </main>
  );
}
