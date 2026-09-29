"use client";

import { useSyncExternalStore } from "react";
import { useFavoriteIds } from "@/entities/favorites/api/use-favorites";
import { useToggleFavorite } from "@/entities/favorites/api/use-toggle-favorite";
import { useRouter } from "next/navigation";
import styles from "./FavoriteButton.module.css";

type Props = {
  listingId: number;
  isAuthenticated: boolean;
};

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function FavoriteButton({ listingId, isAuthenticated }: Props) {
  const router = useRouter();
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const { data: favoriteIds = [] } = useFavoriteIds(isAuthenticated);
  const { mutate } = useToggleFavorite();

  const isFavorite = isClient ? favoriteIds.includes(listingId) : false;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/listings/${listingId}`);
      return;
    }

    if (typeof window !== "undefined" && !window.navigator.onLine) {
      alert("Не удалось изменить избранное. Сетевая ошибка. Проверьте подключение.");
      return;
    }

    mutate({ listingId, currentStatus: isFavorite });
  }

  return (
    <button
      type="button"
      className={styles.favorite}
      aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
      aria-pressed={isFavorite}
      onClick={handleClick}
    >
      {isFavorite ? "♥" : "♡"}
    </button>
  );
}
