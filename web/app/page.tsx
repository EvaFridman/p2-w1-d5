import { Suspense } from "react";
import Link from "next/link";

import styles from "./page.module.css";

import { districtApi } from "@/entities/district/api";
import { listingApi } from "@/entities/listing/api";
import { ListingCard } from "@/entities/listing/ui/ListingCard";
import { HomeListingFilter } from "@/features/listing-filter/home/HomeListingFilter";
import { DistrictList } from "@/entities/district/ui/DistrictList";
import { DealSteps } from "@/widgets/DealSteps/DealSteps";
import { Loader } from "@/shared/ui";
import { getSession } from "@/shared/session";

type Props = {
  listings: Awaited<ReturnType<typeof listingApi.getCachedListings>>;
};

async function HomeListings({ listings }: Props) {
  const session = await getSession();
  const isAuthenticated = session !== null;

  return listings.length > 0 ? (
    <div className={styles.listings}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} isAuthenticated={isAuthenticated} />
      ))}
    </div>
  ) : (
    <div className={styles.empty}>
      <h3>Объявлений пока нет</h3>
      <p>Новые предложения появятся здесь.</p>
    </div>
  );
}

export default async function HomePage() {
  const [listings, districts] = await Promise.all([
    listingApi.getCachedListings({
      page: 1,
      limit: 6,
      sortBy: "publishedAt",
      sortOrder: "desc",
    }),
    districtApi.getCachedDistricts(),
  ]);

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroContent}`}>
          <h1>Квартиры и дома в Санкт-Петербурге</h1>
          <p>Продажа и аренда жилья от собственников и агентств.</p>
          <HomeListingFilter districts={districts} />
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2>Новые объявления</h2>
          <Link href="/listings">Весь каталог →</Link>
        </div>

        <Suspense fallback={<Loader />}>
          <HomeListings listings={listings} />
        </Suspense>
      </section>

      <section className={`container ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Районы</h2>
        <DistrictList districts={districts} />
      </section>

      <section className={`container ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Как проходит сделка</h2>
        <DealSteps />
      </section>
    </>
  );
}
