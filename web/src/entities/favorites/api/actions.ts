"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";
import { ApiError } from "@/shared/api/errors";

type FavoriteActionState = {
  isFavorite?: boolean;
  error?: string;
};

export async function toggleFavorite(
  listingId: number,
  isFavorite: boolean,
): Promise<FavoriteActionState> {
  const session = await getSession();

  if (!session) redirect(`/login?returnUrl=/listings/${listingId}`);

  try {
    if (isFavorite)
      return await apiFetch<FavoriteActionState>(`/public/listings/${listingId}/favorite`, {
        method: "DELETE",
      });
    return await apiFetch<FavoriteActionState>(`/public/listings/${listingId}/favorite`, {
      method: "POST",
    });
  } catch (error) {
    if (!isFavorite && error instanceof ApiError && error.status === 409)
      return { isFavorite: true };
    return { error: "Не удалось изменить избранное. Попробуйте ещё раз." };
  }
}
