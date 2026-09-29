import { districtApi } from "@/entities/district/api";
import { apiFetch } from "@/shared/api/api-fetch";

type SitemapListing = {
  id: number;
  updatedAt: string;
};

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const [districts, listings] = await Promise.all([
    districtApi.getCachedDistricts(),
    apiFetch<SitemapListing[]>("/public/sitemap/listings", { skipAuth: true }),
  ]);

  const listingLinks = listings
    .slice(0, 10)
    .map((listing) => `- [Объявление ${listing.id}](${baseUrl}/listings/${listing.id})`)
    .join("\n");

  const districtLinks = districts
    .map((district) => `- [${district.title}](${baseUrl}/districts/${district.slug})`)
    .join("\n");

  const content = `# Витрина недвижимости

> Витрина объявлений о продаже и аренде недвижимости.
> Продажа и аренда жилья от собственников и агентств.

## Объявления

${listingLinks}

## Районы

${districtLinks}

## О сервисе

- [О сервисе](${baseUrl}/about)

`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
