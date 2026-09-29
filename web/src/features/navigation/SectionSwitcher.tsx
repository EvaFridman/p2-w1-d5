"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./SectionSwitcher.module.css";

export const navItems = [
  { id: "listings", title: "Каталог", path: "/listings" },
  { id: "districts", title: "Районы", path: "/districts" },
  { id: "about", title: "О сервисе", path: "/about" },
];

type Props = { variant: "header" | "footer" };

export function SectionSwitcher({ variant }: Props): ReactNode {
  const pathname = usePathname();

  return (
    <nav className={styles[variant]}>
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={item.path}
          className={pathname === item.path ? styles.active : styles.link}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
