"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";

import type { AuthUser } from "@/shared/session/types";
import { Button, Input } from "@/shared/ui";
import { createViewingRequest } from "./actions";

import styles from "./ViewingRequestForm.module.css";

type Props = {
  listingId: number;
  user: AuthUser | null;
};

type ViewingRequestActionState = {
  fieldErrors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
};

const initialState: ViewingRequestActionState = {};

export function ViewingRequestForm({ listingId, user }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  const [state, formAction, isPending] = useActionState(
    createViewingRequest.bind(null, listingId),
    initialState,
  );

  if (state.success) {
    return (
      <div className={styles.success}>
        <p>Заявка успешно отправлена. Мы свяжемся с вами для подтверждения просмотра.</p>
        <Link href="/account/viewings">Мои заявки</Link>
      </div>
    );
  }

  const isClient = user?.role === "client";

  return (
    <form action={formAction} className={styles.form}>
      {isClient && !isEditing ? (
        <div className={styles.userInfo}>
          <p>Отправим от имени {user.name}</p>
          <button type="button" onClick={() => setIsEditing(true)}>
            Изменить
          </button>
        </div>
      ) : (
        <fieldset className={styles.fields}>
          <label>
            Имя
            <Input name="name" type="text" placeholder="Ваше имя" defaultValue={user?.name ?? ""} />
            {state.fieldErrors?.name && (
              <span className={styles.error}>{state.fieldErrors.name[0]}</span>
            )}
          </label>

          <label>
            Телефон
            <Input
              name="phone"
              type="tel"
              placeholder="+7 (___) ___-__-__"
              defaultValue={user?.phone ?? ""}
            />
            {state.fieldErrors?.phone && (
              <span className={styles.error}>{state.fieldErrors.phone[0]}</span>
            )}
          </label>

          <label>
            Email
            <Input
              name="email"
              type="email"
              placeholder="example@mail.ru"
              defaultValue={user?.email ?? ""}
            />
            {state.fieldErrors?.email && (
              <span className={styles.error}>{state.fieldErrors.email[0]}</span>
            )}
          </label>
        </fieldset>
      )}

      <fieldset className={styles.fields}>
        <label>
          Дата
          <Input name="date" type="date" />
          {state.fieldErrors?.date && (
            <span className={styles.error}>{state.fieldErrors.date[0]}</span>
          )}
        </label>

        <label>
          Время
          <Input name="time" type="time" />
          {state.fieldErrors?.time && (
            <span className={styles.error}>{state.fieldErrors.time[0]}</span>
          )}
        </label>

        <label className={styles.comment}>
          Комментарий
          <textarea name="comment" placeholder="Дополнительная информация" rows={4} />
          {state.fieldErrors?.comment && (
            <span className={styles.error}>{state.fieldErrors.comment[0]}</span>
          )}
        </label>
      </fieldset>

      <input type="hidden" name="editContact" value={isEditing ? "true" : "false"} />

      {state.error && <p className={styles.error}>{state.error}</p>}

      <Button type="submit" variant="primary" size="md" disabled={isPending}>
        {isPending ? "Отправляем..." : "Отправить заявку"}
      </Button>
    </form>
  );
}
