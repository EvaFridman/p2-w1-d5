import type { PublicDistrictType } from "../types";
import type { PublicListingType } from "@/entities/listing/types";

export function getDistrictJsonLd(district: PublicDistrictType, listings: PublicListingType[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${district.title}, ${district.city}`,
    numberOfItems: listings.length,
    itemListElement: listings.map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        name: listing.title,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/listings/${listing.id}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: listing.address,
          addressLocality: district.city,
        },
      },
    })),
  };
}
