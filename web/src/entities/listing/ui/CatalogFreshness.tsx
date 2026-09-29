import { catalogCacheValidUntil } from "@/shared/lib/catalog-cache-time";

export function CatalogFreshness() {
  const time = catalogCacheValidUntil.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return <p>Данные актуальны до {time}</p>;
}
