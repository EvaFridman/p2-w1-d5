import { cacheLife, cacheTag } from "next/cache";

import { apiFetch } from "@/shared/api/api-fetch";
import type { PublicDistrictType } from "../types";

export const districtApi = {
  getDistricts(query?: Record<string, string | number | boolean | undefined>) {
    return apiFetch<PublicDistrictType[]>("/public/districts", { query });
  },

  async getCachedDistrictBySlug(slug: string) {
    "use cache";
    cacheLife("hours");
    cacheTag("districts");

    return apiFetch<PublicDistrictType>(`/public/districts/${slug}`, { skipAuth: true });
  },

  async getCachedDistricts() {
    "use cache";
    cacheLife("hours");
    cacheTag("districts");

    return apiFetch<PublicDistrictType[]>("/public/districts", { skipAuth: true });
  },
};
