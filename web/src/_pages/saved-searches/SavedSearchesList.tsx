"use client";

import Link from "next/link";
import { useState } from "react";

import type { SavedSearchType } from "@/entities/saved-search/types";
import {
  useDeleteSavedSearch,
  useSavedSearches,
} from "@/entities/saved-search/api/use-saved-searches";
import { Button, EmptyState, StatusBadge } from "@/shared/ui";
import { APP_TIME_ZONE } from "@/shared/lib/format";

import styles from "./SavedSearchesList.module.scss";

type Props = {
  initialData: SavedSearchType[];
};

function formatSavedAt(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "long",
  });
}

export function SavedSearchesList({ initialData }: Props) {
  const { data: searches = [] } = useSavedSearches(initialData);
  const deleteSavedSearch = useDeleteSavedSearch();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function copyLink(search: SavedSearchType) {
    await navigator.clipboard.writeText(`${window.location.origin}/searches/${search.token}`);
    setCopiedId(search.id);
  }

  if (searches.length === 0) {
    return (
      <EmptyState
        title="Сохранённых поисков пока нет"
        description="Настройте фильтры в каталоге и нажмите «Сохранить поиск» — он появится здесь."
        action={
          <Link className={styles.open} href="/listings">
            Перейти в каталог
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.container}>
      {deleteSavedSearch.isError && (
        <p className={styles.error} role="alert">
          {deleteSavedSearch.error.message}
        </p>
      )}

      <ul className={styles.list}>
        {searches.map((search) => (
          <li key={search.id} className={styles.item}>
            <div className={styles.info}>
              <h3>{search.name}</h3>
              <span className={styles.meta}>Сохранён {formatSavedAt(search.createdAt)}</span>
            </div>

            {search.isOutdated && <StatusBadge variant="warning">Поиск устарел</StatusBadge>}

            <div className={styles.actions}>
              {!search.isOutdated && (
                <Link className={styles.open} href={`/listings?${search.query}`}>
                  Открыть
                </Link>
              )}
              {!search.isOutdated && (
                <Button variant="ghost" size="sm" onClick={() => copyLink(search)}>
                  {copiedId === search.id ? "Ссылка скопирована" : "Скопировать ссылку"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={deleteSavedSearch.isPending && deleteSavedSearch.variables === search.id}
                onClick={() => deleteSavedSearch.mutate(search.id)}
              >
                Удалить
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
