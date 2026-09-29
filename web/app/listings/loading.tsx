import { Skeleton } from "@/shared/ui";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={`container ${styles.page}`}>
      <section className={styles.breadcrumbs}>
        <Skeleton width="70px" height="14px" />
        <Skeleton width="70px" height="14px" />
      </section>

      <section className={styles.header}>
        <Skeleton width="360px" height="38px" />
        <Skeleton width="520px" height="20px" />
      </section>

      <section className={styles.content}>
        <aside className={styles.filters}>
          <Skeleton width="100%" height="620px" />
        </aside>

        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <Skeleton width="130px" height="20px" />
            <Skeleton width="190px" height="40px" />
          </div>

          <section className={styles.listings}>
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className={styles.card}>
                <Skeleton width="100%" height="190px" />

                <div className={styles.cardContent}>
                  <Skeleton width="55%" height="22px" />
                  <Skeleton width="80%" height="18px" />
                  <Skeleton width="65%" height="16px" />
                  <Skeleton width="90%" height="14px" />
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
