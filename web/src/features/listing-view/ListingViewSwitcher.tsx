"use client";

import { useAppStore } from "@/shared/providers/app-store-provider";
import styles from "./ListingViewSwitcher.module.css";

export function ListingViewSwitcher() {
  const view = useAppStore((state) => state.catalogView);
  const setCatalogView = useAppStore((state) => state.setCatalogView);

  return (
    <div className={styles.switcher} aria-label="Вид объявлений">
      <button
        type="button"
        className={view === "grid" ? styles.active : styles.button}
        onClick={() => setCatalogView("grid")}
        aria-label="Плитка"
        aria-pressed={view === "grid"}
      >
        ▦
      </button>

      <button
        type="button"
        className={view === "list" ? styles.active : styles.button}
        onClick={() => setCatalogView("list")}
        aria-label="Список"
        aria-pressed={view === "list"}
      >
        ☰
      </button>
    </div>
  );
}
