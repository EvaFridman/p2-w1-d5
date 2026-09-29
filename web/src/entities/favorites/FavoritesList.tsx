import Link from "next/link";

import { getFavoriteIds } from "@/entities/favorites/api";
import { listingApi } from "@/entities/listing/api";
import { getSession } from "@/shared/session";

import { FavoriteListings } from "./FavoriteListings";

import styles from "./FavoritesList.module.css";

export async function FavoritesList() {
  const session = await getSession();
  const isAuthenticated = session !== null;

  const favoriteIds = await getFavoriteIds();

  if (favoriteIds.length === 0) {
    return (
      <section className={styles.empty}>
        <h3>В избранном пусто</h3>
        <p>
          Нажмите сердечко на карточке объявления — оно появится здесь и сохранится между
          устройствами.
        </p>
        <Link href="/listings" className={styles.catalogLink}>
          Перейти в каталог
        </Link>
      </section>
    );
  }

  const listings = await Promise.all(favoriteIds.map((id) => listingApi.getListingById(id)));

  return <FavoriteListings listings={listings.filter(Boolean)} isAuthenticated={isAuthenticated} />;
}
