import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>Privacy Policy</h1>
      <div className={styles.body}>
        <p className={styles.muted}>
          Placeholder policy — to be finalized before public launch.
        </p>
        <p>
          Pointsy is built around data minimization, especially for children.
          Only parents have accounts and provide personal data (name, email).
        </p>
        <h2>Children&rsquo;s data</h2>
        <p>
          A child is represented only by a display name, an avatar, a color, and
          a PIN — set by a parent. We do not collect children&rsquo;s emails,
          contact details, or any behavioral tracking, and we never show ads.
        </p>
        <h2>Your control</h2>
        <p>
          A parent can edit or delete any child profile, export the
          family&rsquo;s data, and delete the entire family at any time, which
          removes all associated records.
        </p>
        <h2>No selling of data</h2>
        <p>We do not sell or share personal data.</p>
      </div>
    </main>
  );
}
