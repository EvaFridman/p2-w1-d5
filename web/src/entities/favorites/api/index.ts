import type { PublicListingType } from "@/entities/listing/types";
import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";

export async function getFavoriteListings() {
  const session = await getSession();
  if (!session) return [];
  return await apiFetch<PublicListingType[]>("/public/favorites/listings");
}
