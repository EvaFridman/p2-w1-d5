import type { HTMLAttributes } from "react";
import styles from "./Skeleton.module.css";

export type Props = HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
};

export function Skeleton({
  width = "100%",
  height = "16px",
  radius = "var(--radius-sm)",
  className = "",
  ...props
}: Props) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
      {...props}
    />
  );
}
