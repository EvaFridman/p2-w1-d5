import { catalogCacheValidUntil } from "@/shared/lib/catalog-cache-time";
import { APP_TIME_ZONE } from "@/shared/lib/format";

export function CatalogFreshness() {
  const time = catalogCacheValidUntil.toLocaleTimeString("ru-RU", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return <p>Данные актуальны до {time}</p>;
}
