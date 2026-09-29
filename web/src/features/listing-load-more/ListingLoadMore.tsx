"use client";

import { useState } from "react";

import { ListingCard } from "@/entities/listing/ui/ListingCard";
import { useFavoriteIds } from "@/entities/favorites/api/use-favorites";
import type { PublicListingType, PublicListingsMetaType } from "@/entities/listing/types";
import { Button } from "@/shared/ui";
import { http } from "@/shared/api/http";

import styles from "./ListingLoadMore.module.css";

type QueryValueType = string | number | string[] | undefined;

type Props = {
  initialItems: PublicListingType[];
  initialMeta: PublicListingsMetaType;
  query: Record<string, QueryValueType>;
  view: "grid" | "list";
  isAuthenticated: boolean;
};

function buildQuery(query: Record<string, QueryValueType>, page: number) {
  const searchParams = new URLSearchParams();

  Object.entries({ ...query, page }).forEach(([key, value]) => {
    if (value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

export function ListingLoadMore({
  initialItems,
  initialMeta,
  query,
  view,
  isAuthenticated,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoading, setIsLoading] = useState(false);

  useFavoriteIds(isAuthenticated);

  const hasMore = meta.page < meta.totalPages;

  async function handleLoadMore() {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const queryString = buildQuery(query, meta.page + 1);
      const { data } = await http.get<{
        items: PublicListingType[];
        meta: PublicListingsMetaType;
      }>(`/listings?${queryString}`);

      setItems((current) => [...current, ...data.items]);
      setMeta(data.meta);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {items.length > 0 ? (
        <section className={view === "list" ? styles.listingsList : styles.listings}>
          {items.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              variant={view === "list" ? "row" : "tile"}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          <h2>Ничего не найдено</h2>
          <p>Попробуйте изменить параметры поиска или сбросить фильтры.</p>
        </div>
      )}

      {hasMore && (
        <div className={styles.loadMore}>
          <Button type="button" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? "Загружаем..." : "Показать ещё"}
          </Button>
        </div>
      )}
    </>
  );
}
