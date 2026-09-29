"use client";

import { useFavoriteIds } from "@/entities/favorites/api/use-favorites";
import type { PublicListingType } from "@/entities/listing/types";
import { ListingCard } from "@/entities/listing/ui/ListingCard";
import { ErrorState } from "@/shared/ui/ErrorState/ErrorState";

import styles from "./FavoritesList.module.css";

type Props = {
  listings: PublicListingType[];
  isAuthenticated: boolean;
};

export function FavoriteListings({ listings: serverListings, isAuthenticated }: Props) {
  const { data: favoriteIds = [], isError, refetch } = useFavoriteIds(isAuthenticated);

  if (isError) {
    return (
      <ErrorState
        title="Не удалось загрузить избранное"
        description="Попробуйте обновить список или повторить попытку позже."
        action={
          <button type="button" onClick={() => refetch()}>
            Обновить
          </button>
        }
      />
    );
  }

  const activeListings = serverListings.filter((listing) => favoriteIds.includes(listing.id));

  if (activeListings.length === 0) {
    return (
      <section className={styles.empty}>
        <h3>В избранном пока ничего нет</h3>
        <p>Добавляйте объявления в избранное, чтобы вернуться к ним позже.</p>
      </section>
    );
  }

  return (
    <section className={styles.listings}>
      {activeListings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} isAuthenticated={isAuthenticated} />
      ))}
    </section>
  );
}
