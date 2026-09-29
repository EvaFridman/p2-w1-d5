import type { HTMLAttributes } from "react";
import styles from "./StatusBadge.module.css";

export type StatusBadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export type Props = HTMLAttributes<HTMLSpanElement> & { variant?: StatusBadgeVariant };

export function StatusBadge({ variant = "neutral", className = "", children, ...props }: Props) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
