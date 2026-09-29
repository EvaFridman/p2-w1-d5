import { Suspense } from "react";
import Link from "next/link";

import styles from "./Header.module.scss";
import { SectionSwitcher } from "@/features/navigation/SectionSwitcher";
import { Logo, Loader } from "@/shared/ui";
import { ThemeSwitcher } from "@/features/theme/ThemeSwitcher";
import { HeaderSearch } from "../../features/header-search/HeaderSearch";
import { RecentlyViewed } from "./RecentlyViewed";
import { HeaderActions } from "./HeaderActions";

export async function Header() {
    return (
        <header className={styles.header}>
            <div className={`container ${styles.content}`}>
                <Logo />
                <Link href="/" className={styles.headerTitle}>Витрина</Link>
                <Suspense fallback={<Loader />}>
                    <SectionSwitcher variant="header" />
                </Suspense>
                <Suspense fallback={<Loader />}>
                    <HeaderSearch />
                </Suspense>
                <Suspense fallback={<Loader />}>
                    <RecentlyViewed />
                </Suspense>
                <HeaderActions />
                <ThemeSwitcher variant="header" />
            </div>
        </header>
    );
}