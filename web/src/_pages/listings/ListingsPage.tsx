import Link from "next/link";

import { districtApi } from "@/entities/district/api";
import { listingApi } from "@/entities/listing/api";
import { getSession } from "@/shared/session";
import { getArrayParam, getStringParam } from "@/shared/lib/params";
import { ListingFilterPanel } from "@/features/listing-filter/catalog/ListingsFilter";
import { ListingSort } from "@/features/listing-filter/catalog/ListingSort";
import { ListingViewSwitcher } from "@/features/listing-view/ListingViewSwitcher";
import { CatalogFreshness } from "@/entities/listing/ui/CatalogFreshness";
import { ListingInfiniteList } from "@/features/listing-infinite-query/ListingInfiniteList";
import type { PublicDistrictType } from "@/entities/district/types";
import { getDistrictJsonLd } from "@/entities/district/lib/district-json-ld";

import styles from "./ListingsPage.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams: SearchParams;
  lockedDistrict?: PublicDistrictType;
};

export async function ListingsPage({ searchParams, lockedDistrict }: Props) {
  const session = await getSession();
  const isAuthenticated = session !== null;

  const page = Number(getStringParam(searchParams.page)) || 1;
  const rooms = getArrayParam(searchParams.rooms);
  const districtId = lockedDistrict?.id ?? getStringParam(searchParams.districtId);

  const query = {
    page,
    limit: 20,
    dealType: getStringParam(searchParams.dealType),
    propertyType: getStringParam(searchParams.propertyType),
    districtId,
    rooms,
    priceMin: getStringParam(searchParams.priceMin),
    priceMax: getStringParam(searchParams.priceMax),
    areaMin: getStringParam(searchParams.areaMin),
    areaMax: getStringParam(searchParams.areaMax),
    search: getStringParam(searchParams.search),
    sortBy: getStringParam(searchParams.sortBy) ?? "publishedAt",
    sortOrder: getStringParam(searchParams.sortOrder) ?? "desc",
  };

  const [result, districts] = await Promise.all([
    listingApi.getListingsWithMeta(query),
    districtApi.getDistricts({ page: 1, limit: 20 }),
  ]);

  const districtJsonLd = lockedDistrict ? getDistrictJsonLd(lockedDistrict, result.items) : null;

  return (
    <>
      <section className={`container ${styles.page}`}>
        <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
          <Link href="/">Главная</Link>
          <span>→</span>
          <Link href="/listings">Каталог</Link>
          {lockedDistrict && (
            <>
              <span>→</span>
              <span>{lockedDistrict.title}</span>
            </>
          )}
        </nav>

        <header className={styles.header}>
          <h1>
            {lockedDistrict
              ? `${lockedDistrict.title}, ${lockedDistrict.city}`
              : "Продажа и аренда жилья"}
          </h1>
          <p>Квартиры, дома и комнаты от собственников и агентств.</p>
        </header>

        <section className={styles.content}>
          <ListingFilterPanel districts={districts} lockedDistrictId={lockedDistrict?.id} />

          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <div className={styles.count}>
                Найдено: <strong>{result.meta.total}</strong>
              </div>
              <div className={styles.controls}>
                <ListingSort />
                <ListingViewSwitcher />
              </div>
            </div>

            <ListingInfiniteList
              initialItems={result.items}
              initialMeta={result.meta}
              query={query}
              isAuthenticated={isAuthenticated}
            />

            <CatalogFreshness />
          </div>
        </section>
      </section>

      {districtJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(districtJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </>
  );
}
