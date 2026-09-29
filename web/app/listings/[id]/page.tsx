import type { Metadata } from "next";
import { cache } from "react";

import { listingApi } from "@/entities/listing/api";
import { ApiError } from "@/shared/api/errors";
import { ListingPage } from "@/_pages/listing/ListingPage";

type Props = {
  params: Promise<{ id: string }>;
};

const getListing = cache((id: string) => listingApi.getCachedListingById(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let listing;
  try {
    listing = await getListing(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404)
      return { title: "Объявление не найдено" };
    throw error;
  }
  const cover = listing.photos.find((photo) => photo.isCover);

  return {
    title: `${listing.title}, ${listing.area} м²`,
    description: `${listing.district.title}, ${listing.price} ₽`,
    alternates: { canonical: `/listings/${id}` },
    ...(cover?.externalUrl && {
      openGraph: { images: [{ url: cover.externalUrl, width: 1200, height: 630 }] },
    }),
  };
}

export async function generateStaticParams() {
  const listings = await listingApi.getListings({
    page: 1,
    limit: 100,
    sortBy: "publishedAt",
    sortOrder: "desc",
  });
  return listings.map((listing) => ({ id: String(listing.id) }));
}

export default function Page({ params }: Props) {
  return <ListingPage paramsPromise={params} />;
}
