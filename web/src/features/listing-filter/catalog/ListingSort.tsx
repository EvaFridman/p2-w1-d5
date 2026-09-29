"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import styles from "./ListingSort.module.css";

const SORT_OPTIONS = [
  { value: "publishedAt:desc", label: "Сначала новые" },
  { value: "price:asc", label: "Цена: по возрастанию" },
  { value: "price:desc", label: "Цена: по убыванию" },
  { value: "area:asc", label: "Площадь: по возрастанию" },
  { value: "area:desc", label: "Площадь: по убыванию" },
];

export function ListingSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortBy = searchParams.get("sortBy") ?? "publishedAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const value = `${sortBy}:${sortOrder}`;

  function handleChange(nextValue: string) {
    const [nextSortBy, nextSortOrder] = nextValue.split(":");
    const params = new URLSearchParams(searchParams.toString());

    params.set("sortBy", nextSortBy);
    params.set("sortOrder", nextSortOrder);
    params.set("page", "1");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <label className={styles.sort}>
      <span>Сортировка</span>

      <select value={value} onChange={(event) => handleChange(event.target.value)}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
