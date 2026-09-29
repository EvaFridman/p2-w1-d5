import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";

export async function getFavoriteIds() {
  const session = await getSession();
  if (!session) return [];
  return await apiFetch<number[]>("/public/favorites");
}
