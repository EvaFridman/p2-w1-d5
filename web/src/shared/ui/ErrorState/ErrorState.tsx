import type { ReactNode } from "react";
import styles from "./ErrorState.module.css";

export type Props = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title = "Сервис временно недоступен",
  description = "Попробуйте обновить страницу или повторить попытку позже.",
  action,
  className = "",
}: Props) {
  return (
    <section className={`${styles.state} ${className}`}>
      <h2 className={styles.title}>{title}</h2>

      {description && <p className={styles.description}>{description}</p>}

      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}
