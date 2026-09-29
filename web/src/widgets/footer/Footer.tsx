import { Suspense } from "react";

import styles from "./Footer.module.css";

import { SectionSwitcher } from "@/features/navigation/SectionSwitcher";
import { ThemeSwitcher } from "@/features/theme/ThemeSwitcher";
import { Loader } from "@/shared/ui";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <section className={`container ${styles.content}`}>
        <div className={styles.mainInfo}>
          <h2>Витрина</h2>
          <p>Объявления о продаже и аренде жилья</p>
        </div>
        <Suspense fallback={<Loader />}>
          <SectionSwitcher variant="header" />
        </Suspense>
        <ThemeSwitcher variant="footer" />
      </section>
    </footer>
  );
}
