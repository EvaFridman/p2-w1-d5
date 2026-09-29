import Link from "next/link";

import type { PublicDistrictType } from "@/entities/district/types";
import { formatListingsCount } from "@/shared/lib/format";
import styles from "./DistrictList.module.css";

type Props = {
  districts: PublicDistrictType[];
};

export function DistrictList({ districts }: Props) {
  return (
    <section className={styles.list}>
      {districts.map((district) => (
        <Link key={district.id} href={`/districts/${district.slug}`} className={styles.item}>
          <h3>{district.title}</h3>
          <span>{formatListingsCount(district.publishedListingsCount)}</span>
        </Link>
      ))}
    </section>
  );
}
