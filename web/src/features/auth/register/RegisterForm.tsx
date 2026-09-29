"use client";

import { useState } from "react";
import Link from "next/link";
import { register } from "../actions";
import { Button, Input } from "@/shared/ui";
import styles from "./RegisterForm.module.css";

export function RegisterForm() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");

    const password = String(formData.get("password") ?? "");
    const passwordRepeat = String(formData.get("passwordRepeat") ?? "");

    if (password !== passwordRepeat) {
      setError("Пароли не совпадают");
      return;
    }

    const result = await register({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password,
    });

    if (result.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <fieldset className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Имя</span>
          <Input name="name" type="text" placeholder="Введите имя" required />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Почта</span>
          <Input name="email" type="email" placeholder="Введите почту" required />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <Input name="phone" type="tel" placeholder="+79991234567" required />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Пароль</span>
          <Input name="password" type="password" placeholder="Введите пароль" required />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Повторите пароль</span>
          <Input name="passwordRepeat" type="password" placeholder="Повторите пароль" required />
        </label>
      </fieldset>

      <label className={styles.consent}>
        <input name="consent" type="checkbox" required />
        <span>
          Я принимаю условия использования сервиса и ознакомлен(а) с политикой конфиденциальности.
        </span>
      </label>

      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit">Создать аккаунт</Button>
      <p className={styles.footer}>
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </form>
  );
}
