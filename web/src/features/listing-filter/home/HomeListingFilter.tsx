"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PublicDistrictType } from "@/entities/district/types";

import styles from "./HomeListingFilter.module.css";

type Props = {
  districts: PublicDistrictType[];
};

export function HomeListingFilter({ districts }: Props) {
  const router = useRouter();

  const [dealType, setDealType] = useState<"sale" | "rent">("sale");
  const [districtId, setDistrictId] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    params.set("dealType", dealType);

    if (districtId) params.set("districtId", districtId);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);

    params.set("page", "1");

    router.push(`/listings?${params.toString()}`);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.dealType}>
        <button
          type="button"
          className={dealType === "sale" ? styles.active : styles.button}
          onClick={() => setDealType("sale")}
        >
          Купить
        </button>
        <button
          type="button"
          className={dealType === "rent" ? styles.active : styles.button}
          onClick={() => setDealType("rent")}
        >
          Снять
        </button>
      </div>

      <label className={styles.field}>
        <span>Город</span>
        <input type="text" value="Санкт-Петербург" readOnly />
      </label>

      <label className={styles.field}>
        <span>Район</span>
        <select value={districtId} onChange={(event) => setDistrictId(event.target.value)}>
          <option value="">Любой</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.title}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.price}>
        <label className={styles.field}>
          <span>Цена от</span>
          <input
            type="number"
            min="0"
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>до</span>
          <input
            type="number"
            min="0"
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
          />
        </label>
      </div>

      <button type="submit" className={styles.submit}>
        Показать
      </button>
    </form>
  );
}
