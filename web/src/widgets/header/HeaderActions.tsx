"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { FavoriteCount } from "@/features/favorites/FavoriteCount";
import { ProfileMenu } from "@/features/profile-menu/ProfileMenu";
import type { AuthUser } from "@/shared/session/types";
import { Loader } from "@/shared/ui";
import { http } from "@/shared/api/http";

import styles from "./Header.module.scss";

export function HeaderActions() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    http
      .get<AuthUser | null>("/auth/me")
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  if (isLoading) return <Loader size={48} />;

  const isAuthenticated = user !== null;

  return (
    <div className={styles.actions}>
      {user ? (
        <>
          <ProfileMenu user={user} onLogout={() => setUser(null)} />
          <Link href="/account/favorites" className={styles.favorite} aria-label="Избранное">
            ♡
            <FavoriteCount isAuthenticated={isAuthenticated} />
          </Link>
        </>
      ) : (
        <Link href="/login" className={styles.login}>
          Войти
        </Link>
      )}
    </div>
  );
}
