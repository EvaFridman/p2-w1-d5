import { Skeleton } from "@/shared/ui";

import styles from "./BusyViewingTimesSkeleton.module.css";

export function BusyViewingTimesSkeleton() {
  return (
    <section className={styles.section}>
      <Skeleton width="220px" height="28px" />

      <div className={styles.list}>
        <Skeleton width="120px" height="36px" />
        <Skeleton width="120px" height="36px" />
        <Skeleton width="120px" height="36px" />
      </div>
    </section>
  );
}
