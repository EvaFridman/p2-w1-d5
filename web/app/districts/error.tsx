"use client";

import { useEffect } from "react";

import styles from "./error.module.css";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={`container ${styles.error}`}>
      <h1>Не удалось загрузить страницу</h1>
      <p>Произошла ошибка при загрузке объявлений. Попробуйте повторить запрос.</p>
      <button type="button" onClick={reset}>
        Повторить
      </button>
    </section>
  );
}
