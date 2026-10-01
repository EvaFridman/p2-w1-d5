import { listingApi } from "@/entities/listing/api";
import { APP_TIME_ZONE } from "@/shared/lib/format";

import styles from "./BusyViewingTimes.module.css";

type Props = {
  listingId: number;
};

export async function BusyViewingTimes({ listingId }: Props) {
  const times = await listingApi.getBusyViewingTimes(listingId);

  return (
    <section className={styles.section}>
      <h2>Занятое время для просмотра</h2>

      {times.length > 0 ? (
        <ul className={styles.list}>
          {times.map((time) => (
            <li key={time}>
              {new Date(time).toLocaleString("ru-RU", {
                timeZone: APP_TIME_ZONE,
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </li>
          ))}
        </ul>
      ) : (
        <p>Занятого времени пока нет.</p>
      )}
    </section>
  );
}
