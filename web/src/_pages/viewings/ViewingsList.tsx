"use client";

import Image from "next/image";
import { useState } from "react";

import type { PublicViewingType, ViewingStatus } from "@/entities/viewing/types";
import { useMyViewings } from "@/entities/viewing/api/use-my-viewings";
import { getUrl } from "@/shared/utils/safeUrl";
import { Skeleton, EmptyState, StatusBadge, Loader, Button } from "@/shared/ui";

import styles from "./ViewingsList.module.css";

type Props = {
  initialData: PublicViewingType[];
  isAuthenticated: boolean;
};

const STATUS_LABELS = {
  CREATED: "Создана",
  PENDING_APPROVAL: "На согласовании",
  APPROVED: "Подтверждена",
  REJECTED: "Отклонена",
  CLOSED: "Закрыта",
} as const;

const getBadgeVariant = (status: ViewingStatus) => {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING_APPROVAL":
      return "warning";
    case "REJECTED":
      return "danger";
    case "CREATED":
      return "info";
    case "CLOSED":
    default:
      return "neutral";
  }
};

function formatViewingDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPhoto(viewing: PublicViewingType) {
  return viewing.listing.photos.find((photo) => photo.isCover) ?? viewing.listing.photos[0];
}

export function ViewingsList({ initialData, isAuthenticated }: Props) {
  const [status, setStatus] = useState<ViewingStatus | undefined>(undefined);
  const [openId, setOpenId] = useState<number | null>(null);

  const {
    data: viewings = [],
    isPending,
    isFetching,
  } = useMyViewings({ status, initialData, isAuthenticated });

  return (
    <div className={styles.container}>
      <nav className={styles.tabs} aria-label="Фильтрация заявок по статусу">
        <Button
          variant={status === undefined ? "outline" : "ghost"}
          size="sm"
          onClick={() => setStatus(undefined)}
        >
          Все
        </Button>
        <Button
          variant={status === "PENDING_APPROVAL" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setStatus("PENDING_APPROVAL")}
        >
          На согласовании
        </Button>
        <Button
          variant={status === "APPROVED" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setStatus("APPROVED")}
        >
          Подтверждены
        </Button>
        <Button
          variant={status === "REJECTED" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setStatus("REJECTED")}
        >
          Отклонены
        </Button>
      </nav>

      {isFetching && !isPending && (
        <div className={styles.syncIndicator} title="Синхронизация данных">
          <Loader size={20} />
        </div>
      )}

      {isPending ? (
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={styles.skeletonItem}>
              <Skeleton width="56px" height="44px" radius="var(--radius-sm)" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <Skeleton width="50%" height="16px" />
                <Skeleton width="25%" height="12px" />
              </div>
              <Skeleton width="110px" height="24px" radius="var(--radius-full)" />
            </div>
          ))}
        </div>
      ) : viewings.length === 0 ? (
        <EmptyState
          title="Заявок пока нет"
          description="Здесь будут отображаться ваши записи на просмотр объектов недвижимости."
        />
      ) : (
        <div className={styles.list}>
          {viewings.map((viewing) => {
            const isOpen = openId === viewing.id;
            const photo = getPhoto(viewing);
            const photoUrl = getUrl(photo?.externalUrl ?? null);

            return (
              <article key={viewing.id} className={`${styles.item} ${isOpen ? styles.open : ""}`}>
                <button
                  type="button"
                  className={styles.header}
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : viewing.id)}
                >
                  <div className={styles.image}>
                    {photoUrl ? (
                      <Image src={photoUrl} alt="" fill sizes="56px" />
                    ) : (
                      <span>нет фото</span>
                    )}
                  </div>

                  <div className={styles.info}>
                    <h3>{viewing.listing.title}</h3>
                    <time dateTime={viewing.preferredAt}>
                      {formatViewingDate(viewing.preferredAt)}
                    </time>
                  </div>

                  <StatusBadge variant={getBadgeVariant(viewing.status)}>
                    {STATUS_LABELS[viewing.status]}
                  </StatusBadge>
                </button>

                {isOpen && (
                  <section className={styles.details}>
                    <div>
                      <span className={styles.detailTitle}>Комментарий</span>
                      <p>{viewing.comment || "Без комментария"}</p>
                    </div>

                    <div>
                      <span className={styles.detailTitle}>Агент</span>
                      <p>
                        {viewing.listing.agent.name}
                        {viewing.listing.agent.phone && ` · ${viewing.listing.agent.phone}`}
                      </p>
                    </div>
                  </section>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
