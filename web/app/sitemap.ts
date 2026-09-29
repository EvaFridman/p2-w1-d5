import type { MetadataRoute } from "next";

import { districtApi } from "@/entities/district/api";
import { apiFetch } from "@/shared/api/api-fetch";

type SitemapListing = {
  id: number;
  updatedAt: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const [districts, listings] = await Promise.all([
    districtApi.getCachedDistricts(),
    apiFetch<SitemapListing[]>("/public/sitemap/listings", { skipAuth: true }),
  ]);

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/districts`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...districts.map((district) => ({
      url: `${baseUrl}/districts/${district.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...listings.map((listing) => ({
      url: `${baseUrl}/listings/${listing.id}`,
      lastModified: listing.updatedAt,
    })),
  ];
}
