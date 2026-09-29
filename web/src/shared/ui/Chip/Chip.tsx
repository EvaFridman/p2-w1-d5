import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Chip.module.css";

export type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  onRemove?: () => void;
};

export function Chip({ children, onRemove, className = "", ...props }: Props) {
  return (
    <button type="button" className={`${styles.chip} ${className}`} {...props}>
      <span>{children}</span>
      {onRemove && (
        <span
          className={styles.remove}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-hidden="true"
        >
          ×
        </span>
      )}
    </button>
  );
}
