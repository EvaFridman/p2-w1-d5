"use client";

import { useFavoriteIds } from "@/entities/favorites/api/use-favorites";
import styles from "./FavoriteCount.module.css";

type Props = {
  isAuthenticated: boolean;
};

export function FavoriteCount({ isAuthenticated }: Props) {
  const { data: favoriteIds = [] } = useFavoriteIds(isAuthenticated);
  const count = favoriteIds.length;
  if (count === 0) return null;

  return <span className={styles.count}>{count}</span>;
}
