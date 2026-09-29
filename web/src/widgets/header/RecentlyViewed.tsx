"use client";

import { useAppStore } from "@/shared/providers/app-store-provider";
import styles from "./Header.module.scss";

export function RecentlyViewed() {
  const ids = useAppStore((state) => state.recentlyViewedIds);

  if (!ids.length) return null;

  return (
    <section className={styles.recentlyViewed}>
      <span>Вы смотрели: </span>
      {ids.map((id, index) => (
        <span key={id}>
          {index > 0 && ", "}#{id}
        </span>
      ))}
    </section>
  );
}
