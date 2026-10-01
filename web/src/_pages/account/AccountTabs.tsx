"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import styles from "./AccountTabs.module.css";

const TABS = [
  { id: "favorites", label: "Избранное", href: "/account/favorites" },
  { id: "viewings", label: "Мои заявки", href: "/account/viewings" },
  { id: "searches", label: "Сохранённые поиски", href: "/account/searches" },
  { id: "profile", label: "Профиль", href: "/account/profile" },
] as const;

export function AccountTabs() {
  const activeTab = useSelectedLayoutSegment();

  return (
    <nav className={styles.tabs} aria-label="Разделы кабинета">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={activeTab === tab.id ? styles.activeTab : styles.tab}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
