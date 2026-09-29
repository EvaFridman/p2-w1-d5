import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { listingApi } from "@/entities/listing/api";
import { getSession } from "@/shared/session";
import { ApiError } from "@/shared/api/errors";
import type { PublicListingType } from "@/entities/listing/types";
import { AgentPhone } from "@/features/agent-phone/AgentPhone";
import { FavoriteButton } from "@/entities/favorites/FavoriteButton";
import { ListingCard } from "@/entities/listing/ui/ListingCard";
import { ListingGalleryDynamic } from "@/widgets/listing-gallery/ListingGalleryDynamic";
import { BusyViewingTimes } from "@/entities/listing/ui/BusyViewingTimes";
import { getListingJsonLd } from "@/entities/listing/lib/listing-json-ld";
import { BusyViewingTimesSkeleton } from "@/entities/listing/ui/BusyViewingTimesSkeleton";
import { ViewingRequestFormContainer } from "@/features/viewing-request/ViewingRequestFormContainer";
import { RecentlyViewedTracker } from "@/features/recently-viewed/RecentlyViewedTracker";
import { formatArea, formatDateFull, formatPrice, formatPricePerMeter } from "@/shared/lib/format";
import { Loader } from "@/shared/ui";

import styles from "./ListingPage.module.css";

type Props = {
  paramsPromise: Promise<{ id: string }>;
};

type ContentProps = {
  paramsPromise: Promise<{ id: string }>;
};

const PROPERTY_TYPE_LABELS = {
  flat: "Квартира",
  house: "Дом",
  room: "Комната",
  commercial: "Коммерческая недвижимость",
};

async function ListingPageContent({ paramsPromise }: ContentProps) {
  const { id } = await paramsPromise;
  let listing: PublicListingType;

  try {
    listing = await listingApi.getCachedListingById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const price = Number(listing.price);

  const [session, similarListings] = await Promise.all([
    getSession(),
    listingApi.getListingsWithMeta({
      districtId: listing.district.id,
      dealType: listing.dealType,
      priceMin: Math.round(price * 0.67),
      priceMax: Math.round(price * 1.33),
      limit: 4,
    }),
  ]);

  const isAuthenticated = session !== null;

  const similar = similarListings.items.filter((item) => item.id !== listing.id).slice(0, 3);

  const isRent = listing.dealType === "rent";
  const jsonLd = getListingJsonLd(listing);

  return (
    <>
      <section className={`container ${styles.page}`}>
        <RecentlyViewedTracker listingId={listing.id} />

        <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
          <Link href="/">Главная</Link>
          <span>→</span>
          <Link href="/listings">Каталог</Link>
          <span>→</span>
          <span>{listing.district.title}</span>
          <span>→</span>
          <span>Объявление</span>
        </nav>

        <header className={styles.header}>
          <h2>{listing.title}</h2>
          <p>
            {listing.address}, {listing.district.title}, {listing.district.city}
          </p>
        </header>

        <div className={styles.main}>
          <div className={styles.gallery}>
            <ListingGalleryDynamic photos={listing.photos} />
          </div>

          <aside className={styles.summary}>
            <strong className={styles.price}>{formatPrice(listing.price, isRent)}</strong>
            <span className={styles.pricePerMeter}>
              {formatPricePerMeter(listing.price, listing.area)}
            </span>
            <Link href="#viewing" className={styles.viewingButton}>
              Записаться на просмотр
            </Link>
            <FavoriteButton listingId={listing.id} isAuthenticated={isAuthenticated} />
            <p>Свяжитесь с агентом, чтобы уточнить детали и выбрать удобное время просмотра.</p>
          </aside>
        </div>

        <section className={styles.section}>
          <h2>Характеристики</h2>

          <dl className={styles.characteristics}>
            <div>
              <dt>Тип сделки</dt>
              <dd>{isRent ? "Аренда" : "Продажа"}</dd>
            </div>
            <div>
              <dt>Тип недвижимости</dt>
              <dd>{PROPERTY_TYPE_LABELS[listing.propertyType]}</dd>
            </div>
            <div>
              <dt>Площадь</dt>
              <dd>{formatArea(listing.area)}</dd>
            </div>
            <div>
              <dt>Комнаты</dt>
              <dd>{listing.rooms ?? "—"}</dd>
            </div>
            <div>
              <dt>Этаж</dt>
              <dd>
                {listing.floor != null
                  ? `${listing.floor}${listing.totalFloors != null ? ` из \${listing.totalFloors}` : ""}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Опубликовано</dt>
              <dd>{formatDateFull(listing.publishedAt)}</dd>
            </div>
          </dl>
        </section>

        {listing.description && (
          <section className={styles.section}>
            <h3>Описание</h3>
            <p className={styles.description}>{listing.description}</p>
          </section>
        )}

        <section className={styles.section}>
          <h2>Агент</h2>

          <div className={styles.agent}>
            <div>
              <strong>{listing.agent.name}</strong>
              <p>Агент</p>
            </div>

            <AgentPhone agentId={listing.agent.id} />
          </div>
        </section>

        <Suspense fallback={<BusyViewingTimesSkeleton />}>
          <BusyViewingTimes listingId={listing.id} />
        </Suspense>

        <section id="viewing" className={styles.section}>
          <h2>Записаться на просмотр</h2>
          <ViewingRequestFormContainer listingId={listing.id} />
        </section>

        {similar.length > 0 && (
          <section className={styles.section}>
            <h2>Похожие объявления</h2>
            <div className={styles.similarListings}>
              {similar.map((item) => (
                <ListingCard key={item.id} listing={item} isAuthenticated={isAuthenticated} />
              ))}
            </div>
          </section>
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}

export function ListingPage({ paramsPromise }: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <ListingPageContent paramsPromise={paramsPromise} />
    </Suspense>
  );
}
