import type { PublicListingType } from "../types";

const PROPERTY_TYPES = {
  flat: "Apartment",
  house: "House",
  room: "Room",
  commercial: "Place",
} as const;

export function getListingJsonLd(listing: PublicListingType) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": PROPERTY_TYPES[listing.propertyType],
    name: listing.title,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.district.city,
    },
    floorSize: {
      "@type": "QuantitativeValue",
      value: Number(listing.area),
      unitText: "m²",
    },
    offers: {
      "@type": "Offer",
      price: Number(listing.price),
      priceCurrency: "RUB",
    },
  };

  if (listing.rooms !== null) jsonLd.numberOfRooms = listing.rooms;

  return jsonLd;
}
