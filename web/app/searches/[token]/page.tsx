import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSavedSearchByToken } from "@/entities/saved-search/api";
import { OutdatedSearch } from "@/_pages/saved-searches/OutdatedSearch";

export const metadata: Metadata = {
  title: "Сохранённый поиск",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SavedSearchLinkPage({ params }: Props) {
  const { token } = await params;
  const search = await getSavedSearchByToken(token);

  if (!search) notFound();
  if (!search.isOutdated) redirect(`/listings?${search.query}`);

  return <OutdatedSearch />;
}
