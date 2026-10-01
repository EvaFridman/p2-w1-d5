import { notFound } from "next/navigation";

import { districtApi } from "@/entities/district/api";
import { ListingsPage } from "@/_pages/listings/ListingsPage";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function DistrictPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const paramsFromUrl = await searchParams;

  let district;

  try {
    district = await districtApi.getCachedDistrictBySlug(slug);
  } catch {
    notFound();
  }

  return <ListingsPage searchParams={paramsFromUrl} lockedDistrict={district} />;
}
