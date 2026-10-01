import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";
import { ApiError } from "@/shared/api/errors";
import type { SavedSearchByTokenType, SavedSearchType } from "../types";

export async function getSavedSearches(): Promise<SavedSearchType[]> {
  const session = await getSession();
  if (!session) return [];
  return await apiFetch<SavedSearchType[]>("/public/saved-searches");
}

export async function getSavedSearchByToken(token: string): Promise<SavedSearchByTokenType | null> {
  try {
    return await apiFetch<SavedSearchByTokenType>(
      `/public/saved-searches/by-token/${encodeURIComponent(token)}`,
      { skipAuth: true, cache: "no-store" },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
