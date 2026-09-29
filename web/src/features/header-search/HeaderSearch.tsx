"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/shared/providers/app-store-provider";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import styles from "@/widgets/header/Header.module.scss";

export function HeaderSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchInput = useAppStore((state) => state.searchQuery);
  const setSearchInput = useAppStore((state) => state.setSearchQuery);

  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    if (urlSearch && !searchInput) {
      setSearchInput(urlSearch);
    }
  }, [searchParams, setSearchInput, searchInput]);

  useEffect(() => {
    if (pathname !== "/listings") return;

    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") ?? "";
    const nextSearch = debouncedSearch.trim();

    if (currentSearch === nextSearch) return;

    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");

    params.set("page", "1");

    router.replace(`/listings?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, pathname, router, searchParams]);

  return (
    <input
      className={styles.search}
      type="search"
      value={searchInput}
      placeholder="Поиск"
      onChange={(event) => setSearchInput(event.target.value)}
      aria-label="Поиск объявлений"
    />
  );
}
