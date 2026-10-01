import Link from "next/link";

import { getFavoriteListings } from "@/entities/favorites/api";
import { getSession } from "@/shared/session";

import { FavoriteListings } from "./FavoriteListings";

import styles from "./FavoritesList.module.css";

export async function FavoritesList() {
  const session = await getSession();
  const isAuthenticated = session !== null;

  const listings = await getFavoriteListings();

  if (listings.length === 0) {
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

  return <FavoriteListings listings={listings} isAuthenticated={isAuthenticated} />;
}
