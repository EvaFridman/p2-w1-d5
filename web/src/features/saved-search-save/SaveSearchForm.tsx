"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useCreateSavedSearch } from "@/entities/saved-search/api/use-saved-searches";

import styles from "./SaveSearchForm.module.scss";

type Props = {
  isAuthenticated: boolean;
  lockedDistrictId?: number;
};

export function SaveSearchForm({ isAuthenticated, lockedDistrictId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const createSavedSearch = useCreateSavedSearch();

  const query = new URLSearchParams(searchParams.toString());
  if (lockedDistrictId !== undefined) query.set("districtId", String(lockedDistrictId));
  const currentUrl = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

  if (!isAuthenticated) {
    return (
      <Link className={styles.trigger} href={`/login?returnUrl=${encodeURIComponent(currentUrl)}`}>
        Сохранить поиск
      </Link>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createSavedSearch.mutate(
      { query: query.toString(), name, returnUrl: currentUrl },
      { onSuccess: () => setName("") },
    );
  }

  function open() {
    createSavedSearch.reset();
    setIsOpen(true);
  }

  if (!isOpen) {
    return (
      <button type="button" className={styles.trigger} onClick={open}>
        Сохранить поиск
      </button>
    );
  }

  if (createSavedSearch.isSuccess) {
    return (
      <div className={styles.panel} role="status">
        <p className={styles.success}>Поиск «{createSavedSearch.data.name}» сохранён.</p>
        <div className={styles.actions}>
          <Link className={styles.link} href="/account/searches">
            Сохранённые поиски
          </Link>
          <button type="button" className={styles.secondary} onClick={() => setIsOpen(false)}>
            Готово
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="saved-search-name">
        Название поиска
      </label>
      <input
        id="saved-search-name"
        className={styles.input}
        value={name}
        maxLength={100}
        placeholder="Необязательно"
        onChange={(event) => setName(event.target.value)}
      />

      {createSavedSearch.isError && (
        <p className={styles.error} role="alert">
          {createSavedSearch.error.message}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={createSavedSearch.isPending}>
          {createSavedSearch.isPending ? "Сохраняем…" : "Сохранить"}
        </button>
        <button type="button" className={styles.secondary} onClick={() => setIsOpen(false)}>
          Отмена
        </button>
      </div>
    </form>
  );
}
