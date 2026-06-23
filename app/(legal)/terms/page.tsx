import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main id="main" className={styles.main}>
      <h1 className={styles.title}>Terms of Service</h1>
      <div className={styles.body}>
        <p className={styles.muted}>
          Placeholder terms — to be finalized before public launch.
        </p>
        <p>
          Pointsy is a free, open-source family points app. By creating an
          account you confirm you are a parent or guardian and are responsible
          for the children&rsquo;s profiles you create within your family.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Use Pointsy lawfully and only to manage your own family&rsquo;s
          points, chores, and rewards. The service is provided &ldquo;as
          is&rdquo; without warranty.
        </p>
        <h2>Accounts</h2>
        <p>
          You are responsible for keeping your password and your family&rsquo;s
          PINs secure. You may export or delete your family&rsquo;s data at any
          time.
        </p>
      </div>
    </main>
  );
}
