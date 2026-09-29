"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  RangeInput,
  Skeleton,
  StatusBadge,
} from "@/shared/ui";
import styles from "./page.module.css";

export default function UiKitPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <main className={`${styles.page} container`}>
      <div className={styles.header}>
        <div>
          <p className={styles.preHeader}>Realty UI Kit</p>
          <h1>Components</h1>
          <p className={styles.description}>Тестовая страница ui-kit</p>
        </div>

        <Button
          variant="outline"
          onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        >
          {theme === "light" ? "Dark theme" : "Light theme"}
        </Button>
      </div>

      <section className={styles.section}>
        <h2>Buttons</h2>

        <div className={styles.row}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        <div className={styles.row}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Inputs</h2>

        <div className={styles.inputs}>
          <Input placeholder="Введите значение" />
          <Input placeholder="Поле с ошибкой" error />
          <RangeInput fromPlaceholder="От" toPlaceholder="До" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Status badges</h2>

        <div className={styles.row}>
          <StatusBadge variant="success">Опубликовано</StatusBadge>
          <StatusBadge variant="warning">На модерации</StatusBadge>
          <StatusBadge variant="danger">Отклонено</StatusBadge>
          <StatusBadge variant="info">На просмотре</StatusBadge>
          <StatusBadge variant="neutral">Черновик</StatusBadge>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Chips</h2>

        <div className={styles.row}>
          <Chip>Продажа</Chip>
          <Chip>2 комнаты</Chip>
          <Chip>54 м²</Chip>
          <Chip>Центр</Chip>
          <Chip onRemove={() => {}}>Удалить</Chip>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Empty state</h2>

        <EmptyState
          title="Ничего не найдено"
          description="Попробуйте изменить параметры поиска."
          action={<Button>Сбросить фильтры</Button>}
        />
      </section>

      <section className={styles.section}>
        <h2>Error state</h2>

        <ErrorState
          title="Не удалось загрузить данные"
          description="Произошла ошибка при получении списка объявлений."
          action={<Button>Повторить</Button>}
        />
      </section>

      <section className={styles.section}>
        <h2>Skeleton</h2>

        <div className={styles.skeletonList}>
          <Skeleton height={180} />
          <div className={styles.skeletonText}>
            <Skeleton width="60%" height={24} />
            <Skeleton width="90%" height={16} />
            <Skeleton width="40%" height={16} />
          </div>
        </div>
      </section>
    </main>
  );
}
