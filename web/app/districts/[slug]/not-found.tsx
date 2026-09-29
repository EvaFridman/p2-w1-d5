import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <section className={`container ${styles.notFound}`}>
      <span className={styles.code}>404</span>
      <h1>Район не найден</h1>
      <p>Возможно, район был удалён или указан неверный адрес.</p>
      <Link href="/districts" className={styles.link}>
        Вернуться к районам
      </Link>
    </section>
  );
}
