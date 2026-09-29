import { cacheLife, cacheTag } from "next/cache";

import { apiFetch, apiFetchWithMeta } from "@/shared/api/api-fetch";
import type { PublicListingType, ListingsApiResponseType, ListingQueryType } from "../types";

export const listingApi = {
  getListings(query?: ListingQueryType) {
    return apiFetch<PublicListingType[]>("/public/listings", { query, skipAuth: true });
  },

  async getCachedListings(query?: ListingQueryType) {
    "use cache";
    cacheLife("hours");
    cacheTag("listings");

    return apiFetch<PublicListingType[]>("/public/listings", { query, skipAuth: true });
  },

  async getListingsWithMeta(query?: ListingQueryType) {
    "use cache";
    cacheLife("hours");
    cacheTag("listings");

    const result = await apiFetchWithMeta<ListingsApiResponseType>("/public/listings", {
      query,
      skipAuth: true,
    });
    return { items: result.data, meta: result.meta };
  },

  getListingById(id: string | number) {
    return apiFetch<PublicListingType>(`/public/listings/${String(id)}`, { skipAuth: true });
  },

  async getCachedListingById(id: string | number) {
    "use cache";
    cacheLife("hours");
    cacheTag("listings");

    return apiFetch<PublicListingType>(`/public/listings/${String(id)}`, { skipAuth: true });
  },

  getAgentPhone(id: number | string) {
    return apiFetch<{ phone: string | null }>(`/public/agents/${String(id)}/phone`);
  },

  getBusyViewingTimes(id: number | string) {
    return apiFetch<string[]>(`/public/listings/${String(id)}/busy-viewing-times`, {
      cache: "no-store",
      skipAuth: true,
    });
  },
};
