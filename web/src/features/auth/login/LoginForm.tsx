"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { login } from "../actions";
import { Button, Input } from "@/shared/ui";
import styles from "./LoginForm.module.css";

type Props = {
  returnUrl?: string;
};

export function LoginForm({ returnUrl }: Props) {
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (!blocked || retryAfter <= 0) return;

    const timer = setInterval(() => {
      setRetryAfter((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [blocked, retryAfter]);

  async function handleSubmit(formData: FormData) {
    setError("");

    const result = await login(
      {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      },
      returnUrl,
    );

    if (result.blocked) {
      setBlocked(true);
      setRetryAfter(result.retryAfter ?? 0);
      return;
    }

    if (result.error) setError(result.error);
  }

  if (blocked) {
    const minutes = Math.floor(retryAfter / 60);
    const seconds = retryAfter % 60;

    return (
      <section className={styles.blocked}>
        <h2 className={styles.blockedTitle}>Вход приостановлен</h2>

        <div className={styles.warning}>
          <p className={styles.warningTitle}>Слишком много попыток входа</p>
          <p>
            Повторите попытку через{" "}
            <strong>
              {minutes}:{String(seconds).padStart(2, "0")}
            </strong>
          </p>
        </div>

        <p className={styles.blockedDescription}>
          После окончания этого времени вы сможете снова попробовать войти.
        </p>

        <Link href="/register" className={styles.blockedLink}>
          Создать аккаунт
        </Link>
      </section>
    );
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <fieldset className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Почта</span>
          <Input name="email" type="email" placeholder="Введите почту" required />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Пароль</span>
          <Input name="password" type="password" placeholder="Введите пароль" required />
        </label>
      </fieldset>

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit">Войти</Button>

      <p className={styles.footer}>
        Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
      </p>
    </form>
  );
}
