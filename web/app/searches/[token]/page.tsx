import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { getSavedSearchByToken } from "@/entities/saved-search/api";
import { Loader } from "@/shared/ui";
import { OutdatedSearch } from "@/_pages/saved-searches/OutdatedSearch";

export const metadata: Metadata = {
  title: "Сохранённый поиск",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
};

async function SavedSearchLinkContent({ params }: Props) {
  const { token } = await params;
  const search = await getSavedSearchByToken(token);

  if (!search) notFound();
  if (!search.isOutdated) redirect(`/listings?${search.query}`);

  return <OutdatedSearch />;
}

export default function SavedSearchLinkPage({ params }: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <SavedSearchLinkContent params={params} />
    </Suspense>
  );
}
