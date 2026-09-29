import Link from "next/link";

import styles from "./Pagination.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
};

function getPageHref(page: number, searchParams: SearchParams) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    if (value !== undefined) params.set(key, value);
  });

  if (page === 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/listings?${query}` : "/listings";
}

export function Pagination({ currentPage, totalPages, searchParams }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className={styles.pagination} aria-label="Пагинация">
      {currentPage > 1 && (
        <Link
          href={getPageHref(currentPage - 1, searchParams)}
          className={styles.link}
          aria-label="Предыдущая страница"
        >
          ←
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={getPageHref(page, searchParams)}
          className={page === currentPage ? styles.active : styles.link}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={getPageHref(currentPage + 1, searchParams)}
          className={styles.link}
          aria-label="Следующая страница"
        >
          →
        </Link>
      )}
    </nav>
  );
}
