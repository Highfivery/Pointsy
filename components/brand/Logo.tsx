import styles from "./logo.module.css";

/** The Pointsy logo lockup — the "P" monogram, optionally with the wordmark. */
export function Logo({
  size = 30,
  withWordmark = true,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <span
      className={styles.lockup}
      aria-label={withWordmark ? undefined : "Pointsy"}
    >
      <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
        <defs>
          <linearGradient
            id="pointsy-mark"
            x1="64"
            y1="64"
            x2="448"
            y2="448"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#34D399" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#pointsy-mark)" />
        <path
          d="M180 388 V150 H266 A66 66 0 0 1 266 282 H180"
          fill="none"
          stroke="#03251B"
          strokeWidth="62"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark ? <span className={styles.wordmark}>Pointsy</span> : null}
    </span>
  );
}
