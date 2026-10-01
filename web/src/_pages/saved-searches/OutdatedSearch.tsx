import Link from "next/link";

import { EmptyState } from "@/shared/ui";

import styles from "./OutdatedSearch.module.scss";

export function OutdatedSearch() {
  return (
    <section className={`container ${styles.page}`}>
      <EmptyState
        title="Поиск устарел"
        description="Каталог изменился, и часть фильтров этого поиска больше не поддерживается. Владелец может удалить его в разделе «Сохранённые поиски»."
        action={
          <Link className={styles.link} href="/listings">
            Перейти в каталог
          </Link>
        }
      />
    </section>
  );
}
