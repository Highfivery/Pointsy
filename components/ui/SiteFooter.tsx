import Link from "next/link";
import { Star } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { InstallLink } from "@/components/pwa/InstallLink";
import styles from "./site-footer.module.css";

const REPO = "https://github.com/Highfivery/Pointsy";

/**
 * Marketing / legal site footer — a modern multi-column layout. Rendered on the
 * public surfaces (homepage, legal, auth), not on the authenticated app screens
 * (those navigate via the bottom nav).
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.brand} aria-label="Pointsy home">
              <Logo size={28} />
            </Link>
            <p className={styles.tagline}>
              Points that make chores fun. A free, private, open-source way for
              families to earn and redeem points.
            </p>
            <ul className={styles.pills}>
              <li>Free forever</li>
              <li>No ads</li>
              <li>Open-source (MIT)</li>
            </ul>
          </div>

          <nav className={styles.col} aria-label="Product">
            <h2 className={styles.colHead}>Product</h2>
            <ul>
              <li>
                <Link href="/#how">How it works</Link>
              </li>
              <li>
                <Link href="/#why">Why Pointsy</Link>
              </li>
              <li>
                <Link href="/#features">Features</Link>
              </li>
              <li>
                <Link href="/#faq">FAQ</Link>
              </li>
            </ul>
          </nav>

          <nav className={styles.col} aria-label="Resources">
            <h2 className={styles.colHead}>Resources</h2>
            <ul>
              <li>
                <Link href="/tools/reward-calculator">Reward calculator</Link>
              </li>
              <li>
                <Link href="/tools/allowance-calculator">
                  Allowance calculator
                </Link>
              </li>
              <li>
                <Link href="/guides/age-appropriate-chores">Chores by age</Link>
              </li>
              <li>
                <Link href="/guides/token-economy-for-kids">Token economy</Link>
              </li>
              <li>
                <Link href="/compare">Compare apps</Link>
              </li>
              <li>
                <Link href="/compare/greenlight">vs Greenlight</Link>
              </li>
              <li>
                <Link href="/compare/busykid">vs BusyKid</Link>
              </li>
              <li>
                <Link href="/compare/famzoo">vs FamZoo</Link>
              </li>
            </ul>
          </nav>

          <nav className={styles.col} aria-label="Get started">
            <h2 className={styles.colHead}>Get started</h2>
            <ul>
              <li>
                <Link href="/sign-up">Create your family</Link>
              </li>
              <li>
                <Link href="/sign-in">Parent sign in</Link>
              </li>
              <li>
                <Link href="/enter">Enter family code</Link>
              </li>
              <li>
                <Link href="/join">Join as a co-parent</Link>
              </li>
              <li>
                <InstallLink className={styles.installLink} />
              </li>
            </ul>
          </nav>

          <nav className={styles.col} aria-label="Company">
            <h2 className={styles.colHead}>Company</h2>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
              <li>
                <a href={REPO} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                <a href="mailto:info@highfivery.com">Contact</a>
              </li>
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © 2026 Highfivery LLC · Pointsy is a Highfivery app · made for
            families
          </p>
          <a
            className={styles.social}
            href={REPO}
            target="_blank"
            rel="noreferrer"
          >
            <Star size={15} aria-hidden="true" />
            Star on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
