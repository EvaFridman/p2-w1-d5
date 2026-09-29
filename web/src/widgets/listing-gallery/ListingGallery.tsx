"use client";

import Image from "next/image";
import { useState } from "react";

import type { PublicPhotoType } from "../../entities/listing/types";
import { EmptyState } from "@/shared/ui";

import styles from "./ListingGallery.module.css";

type Props = {
  photos: PublicPhotoType[];
};

export function ListingGallery({ photos }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos.length === 0) {
    return <EmptyState title="Нет фотографий" />;
  }

  const currentPhoto = photos[currentIndex];

  function showPrevious() {
    setCurrentIndex((index) => (index === 0 ? photos.length - 1 : index - 1));
  }

  function showNext() {
    setCurrentIndex((index) => (index === photos.length - 1 ? 0 : index + 1));
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImage}>
        {currentPhoto.externalUrl ? (
          <Image
            src={currentPhoto.externalUrl}
            alt={`Фото ${currentPhoto.position}`}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1199px) 70vw, 800px"
            fetchPriority="high"
          />
        ) : (
          <div className={styles.placeholder}>Нет фото</div>
        )}

        {photos.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.previous}`}
              onClick={showPrevious}
              aria-label="Предыдущее фото"
            >
              ←
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.next}`}
              onClick={showNext}
              aria-label="Следующее фото"
            >
              →
            </button>
          </>
        )}

        <span className={styles.counter}>
          {currentIndex + 1} из {photos.length}
        </span>
      </div>

      {photos.length > 1 && (
        <div className={styles.thumbnails}>
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              className={`${styles.thumbnail} ${index === currentIndex ? styles.active : ""}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Показать фото ${photo.position}`}
            >
              {photo.externalUrl ? (
                <Image src={photo.externalUrl} alt="" fill sizes="80px" />
              ) : (
                <span>Нет фото</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
