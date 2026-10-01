import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSavedSearches } from "@/entities/saved-search/api";
import { getSession } from "@/shared/session";
import { Loader } from "@/shared/ui";
import { SavedSearchesList } from "@/_pages/saved-searches/SavedSearchesList";

export const metadata: Metadata = { title: "Сохранённые поиски" };

async function AccountSearchesContent() {
  const session = await getSession();
  if (!session) redirect("/login?returnUrl=/account/searches");

  const searches = await getSavedSearches();

  return <SavedSearchesList initialData={searches} />;
}

export default function AccountSearchesPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AccountSearchesContent />
    </Suspense>
  );
}
