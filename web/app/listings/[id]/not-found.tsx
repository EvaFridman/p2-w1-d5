import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <section className={`container ${styles.notFound}`}>
      <span className={styles.code}>404</span>
      <h1>Объявление не найдено</h1>
      <p>Возможно, объявление было удалено или больше не опубликовано.</p>
      <Link href="/listings">Вернуться в каталог</Link>
    </section>
  );
}
