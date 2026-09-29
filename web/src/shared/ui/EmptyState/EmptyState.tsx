import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className = "" }: Props) {
  return (
    <section className={`${styles.state} ${className}`}>
      <h2 className={styles.title}>{title}</h2>

      {description && <p className={styles.description}>{description}</p>}

      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}
