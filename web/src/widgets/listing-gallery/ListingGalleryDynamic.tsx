"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

import type { PublicPhotoType } from "@/entities/listing/types";
import { Loader } from "@/shared/ui";

import styles from "./ListingGalleryDynamic.module.css";

const ListingGallery = dynamic(
  () => import("./ListingGallery").then((module) => module.ListingGallery),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <Loader size={48} />
      </div>
    ),
  },
);

type Props = {
  photos: PublicPhotoType[];
};

export function ListingGalleryDynamic({ photos }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const firstPhoto = photos.find((photo) => photo.isCover) ?? photos[0];
  if (isOpen) return <ListingGallery photos={photos} />;

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImage}>
        {firstPhoto?.externalUrl ? (
          <Image
            src={firstPhoto.externalUrl}
            alt={`Фото ${firstPhoto.position}`}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1199px) 70vw, 800px"
            fetchPriority="high"
          />
        ) : (
          <div className={styles.placeholder}>Нет фото</div>
        )}

        {photos.length > 1 && (
          <button type="button" className={styles.openButton} onClick={() => setIsOpen(true)}>
            Открыть галерею
          </button>
        )}
        {photos.length > 0 && <span className={styles.counter}>1 из {photos.length}</span>}
      </div>
    </div>
  );
}
