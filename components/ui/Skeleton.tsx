import styles from "./skeleton.module.css";

/** Decorative loading placeholder (pulses unless reduced-motion is preferred). */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={[styles.skeleton, className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden="true"
    />
  );
}

/** Generic page skeleton: a title bar plus a few card placeholders. */
export function PageSkeleton() {
  return (
    <div className={styles.page} aria-hidden="true">
      <Skeleton style={{ width: "45%", height: "2rem" }} />
      <Skeleton style={{ height: "5rem" }} />
      <Skeleton style={{ height: "5rem" }} />
      <Skeleton style={{ height: "5rem" }} />
    </div>
  );
}
