"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";
import { ApiError } from "@/shared/api/errors";
import type { SavedSearchActionResultType, SavedSearchType } from "../types";

const ERROR_MESSAGES: Record<string, string> = {
  SAVED_SEARCH_DUPLICATE_QUERY: "Такой поиск уже сохранён.",
  SAVED_SEARCH_DUPLICATE_NAME: "Поиск с таким названием уже есть.",
  SAVED_SEARCH_LIMIT: "Можно сохранить не больше 10 поисков. Удалите ненужные в кабинете.",
  SAVED_SEARCH_INVALID_QUERY: "Каталог не принимает эти фильтры. Измените их и попробуйте снова.",
};

function toMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  if (error.status === 400) return "Название — не длиннее 100 символов.";
  if (error.status === 403) return "Сохранять поиски могут только клиенты.";
  if (error.status === 404) return "Поиск уже удалён.";
  return fallback;
}

export async function createSavedSearch(
  query: string,
  name: string,
  returnUrl: string,
): Promise<SavedSearchActionResultType> {
  const session = await getSession();
  if (!session) redirect(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);

  try {
    const savedSearch = await apiFetch<SavedSearchType>("/public/saved-searches", {
      method: "POST",
      body: { query, ...(name.trim() ? { name: name.trim() } : {}) },
    });
    return { savedSearch };
  } catch (error) {
    return { error: toMessage(error, "Не удалось сохранить поиск. Попробуйте ещё раз.") };
  }
}

export async function deleteSavedSearch(id: number): Promise<SavedSearchActionResultType> {
  try {
    await apiFetch(`/public/saved-searches/${id}`, { method: "DELETE" });
    return {};
  } catch (error) {
    return { error: toMessage(error, "Не удалось удалить поиск. Попробуйте ещё раз.") };
  }
}
