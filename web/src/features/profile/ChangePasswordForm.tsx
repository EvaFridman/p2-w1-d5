"use client";

import { useActionState } from "react";

import { Button, Input } from "@/shared/ui";
import { changePassword } from "./actions";

import type { ChangePasswordState } from "./actions";

import styles from "./ChangePasswordForm.module.css";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <h2>Смена пароля</h2>

      <label className={styles.field}>
        <span className={styles.label}>Текущий пароль</span>
        <Input
          name="currentPassword"
          type="password"
          placeholder="Введите текущий пароль"
          required
          minLength={8}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Новый пароль</span>
        <Input
          name="newPassword"
          type="password"
          placeholder="Введите новый пароль"
          required
          minLength={8}
        />
      </label>

      {state.error && <p className={styles.error}>{state.error}</p>}
      {state.success && <p className={styles.success}>Пароль успешно изменён.</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем..." : "Сменить пароль"}
      </Button>
    </form>
  );
}
