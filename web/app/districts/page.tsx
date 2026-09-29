import type { Metadata } from "next";
import Link from "next/link";

import { districtApi } from "@/entities/district/api";
import { DistrictList } from "@/entities/district/ui/DistrictList";

export const metadata: Metadata = { title: "Районы" };

export default async function DistrictsPage() {
  const districts = await districtApi.getCachedDistricts();

  return (
    <section className="container">
      <nav aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        <span> → </span>
        <span>Районы</span>
      </nav>

      <header>
        <h1>Районы</h1>
        <p>Выберите район, чтобы посмотреть объявления в нём.</p>
      </header>

      <DistrictList districts={districts} />
    </section>
  );
}
