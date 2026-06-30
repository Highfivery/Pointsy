import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Pointsy handles your family's data — privacy-first, child-data-minimizing, no ads, no tracking, no selling. COPPA and GDPR-K aligned.",
};

export default function PrivacyPage() {
  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>Privacy Policy</h1>
      <div className={styles.body}>
        <p className={styles.effective}>Effective June 30, 2026</p>

        <p>
          Pointsy (&ldquo;Pointsy,&rdquo; the &ldquo;Service&rdquo;) is operated
          by <strong>Highfivery LLC</strong> (&ldquo;Highfivery,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;), a Texas, USA limited liability
          company. This policy explains what we collect, why, and the choices
          you have. It covers the hosted service at{" "}
          <Link href="/">pointsy.kids</Link>.
        </p>
        <p>
          Pointsy is built privacy-first, with special care for children. We
          collect the least data needed to run a family points app, we show no
          ads, we do no behavioral tracking, and we never sell your data.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Parent account.</strong> Your name, email address, and a
            password (stored only as a secure hash). You may optionally set a
            PIN, also stored as a hash.
          </li>
          <li>
            <strong>Children&rsquo;s profiles.</strong> A child profile is
            created and managed by a parent and contains only a display name, an
            avatar (a preset icon), a color, and a 4-digit PIN (stored as a
            hash). We do <strong>not</strong> collect a child&rsquo;s email,
            phone, photo, precise location, or any contact information, and we
            do no behavioral tracking or profiling of children.
          </li>
          <li>
            <strong>Family data.</strong> Your family&rsquo;s name, a join code,
            your time zone (to schedule daily/weekly resets), and the activity
            ledger (points earned and redeemed for the chores and rewards you
            create).
          </li>
          <li>
            <strong>Technical data.</strong> Basic server and security logs
            (such as IP address and request metadata) needed to operate and
            protect the Service. We do not use third-party analytics or
            advertising trackers.
          </li>
        </ul>

        <h2>How we use information</h2>
        <p>
          We use this data only to provide the Service: to sign you in, keep
          your family&rsquo;s data separate and secure, and run points, chores,
          and rewards. We do not use your data for advertising, profiling, or
          any purpose unrelated to operating Pointsy, and we do not sell or rent
          it. We do not send marketing email — in fact, Pointsy sends no email
          at all.
        </p>

        <h2>Children&rsquo;s privacy (COPPA &amp; GDPR-K)</h2>
        <p>
          Pointsy is designed for parents and guardians to manage their own
          family. Children do not have accounts of their own, do not provide any
          personal information directly to us, and cannot use Pointsy to contact
          anyone or be contacted.
        </p>
        <ul>
          <li>
            Only a parent or guardian creates and manages child profiles. By
            doing so, you provide consent — as required by the U.S.
            Children&rsquo;s Online Privacy Protection Act (COPPA) and Article 8
            of the EU/UK GDPR (&ldquo;GDPR-K&rdquo;) — for the limited
            information described above.
          </li>
          <li>
            We practice data minimization: a child is represented only by a
            display name, avatar, color, and PIN that you choose.
          </li>
          <li>
            You can review and edit any child profile in the app at any time. To
            export or permanently delete a child profile — or your whole family
            — and its associated records, email us and we&rsquo;ll take care of
            it promptly.
          </li>
        </ul>

        <h2>Legal bases (EU/UK)</h2>
        <p>
          Where the GDPR applies, we process data to perform our agreement with
          you (providing the Service), on the basis of your consent (including
          parental consent for children&rsquo;s data), and for our legitimate
          interest in keeping the Service secure.
        </p>

        <h2>How we share data</h2>
        <p>
          We do not sell, rent, or trade personal data, and we do not share it
          for advertising. We rely on a small number of service providers to run
          Pointsy, who process data only on our instructions:
        </p>
        <ul>
          <li>
            <strong>Vercel</strong> — application hosting (United States).
          </li>
          <li>
            <strong>Neon</strong> — managed PostgreSQL database (United States).
          </li>
        </ul>
        <p>
          We may also disclose information if required by law or to protect the
          rights, safety, or security of our users or the Service.
        </p>

        <h2>Data retention</h2>
        <p>
          We keep your family&rsquo;s data for as long as your account exists.
          When a child profile is deleted, or when we delete your family at your
          request, the associated records are removed from our live systems, and
          any residual copies in routine backups are overwritten within 30 days.
        </p>

        <h2>Security</h2>
        <p>
          Passwords and PINs are stored only as strong one-way hashes (argon2),
          never in plain text. Data is encrypted in transit (HTTPS), sessions
          use signed tokens, and each family&rsquo;s data is isolated from every
          other family. No online service can be guaranteed perfectly secure,
          but we take protecting your family&rsquo;s data seriously.
        </p>

        <h2>Your rights</h2>
        <p>
          You can view and update your family&rsquo;s profiles in the app at any
          time. To access, export, correct, or permanently delete your
          family&rsquo;s data — including deleting your entire family — email{" "}
          <a href="mailto:info@highfivery.com">info@highfivery.com</a> and
          we&rsquo;ll action your request promptly. Depending on where you live,
          you may also have rights under the GDPR (EU/UK), the CCPA
          (California), or similar laws — including the rights to access,
          delete, and port your data. Because we don&rsquo;t sell data or serve
          ads, there is nothing to opt out of on that front.
        </p>

        <h2>International users</h2>
        <p>
          Pointsy is operated from the United States, and our providers store
          data in the United States. If you use Pointsy from outside the U.S.,
          you consent to your data being processed there.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If we make material changes, we&rsquo;ll update the effective date
          above and, where appropriate, note the change in the app. Continued
          use of Pointsy after a change means you accept the updated policy.
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
