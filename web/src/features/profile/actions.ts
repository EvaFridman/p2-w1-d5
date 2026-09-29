"use server";

import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";
import { ApiError } from "@/shared/api/errors";

export type ChangePasswordState = {
  success?: boolean;
  error?: string;
};

export async function changePassword(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();

  if (!session) return { error: "Необходимо войти в аккаунт." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (currentPassword.length < 8)
    return { error: "Текущий пароль должен содержать минимум 8 символов." };
  if (newPassword.length < 8) return { error: "Новый пароль должен содержать минимум 8 символов." };

  try {
    await apiFetch("/auth/password", {
      method: "PATCH",
      body: {
        currentPassword,
        newPassword,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { error: "Текущий пароль указан неверно." };
    }

    return { error: "Не удалось изменить пароль. Попробуйте ещё раз." };
  }
}
