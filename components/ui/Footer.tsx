import Link from "next/link";
import { InstallLink } from "@/components/pwa/InstallLink";
import styles from "./footer.module.css";

const REPO = "https://github.com/Highfivery/Pointsy";

/** App-wide footer: attribution, legal links, and a way to report bugs / ideas. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.links} aria-label="Footer">
          <InstallLink className={styles.link} />
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
            Report a bug or request a feature
          </a>
        </nav>
        <p className={styles.meta}>
          <span className={styles.brand}>Pointsy</span> — a Highfivery app ·
          free &amp; open-source (MIT)
        </p>
      </div>
    </footer>
  );
}
