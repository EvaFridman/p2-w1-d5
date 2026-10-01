import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSavedSearches } from "@/entities/saved-search/api";
import { getSession } from "@/shared/session";
import { SavedSearchesList } from "@/_pages/saved-searches/SavedSearchesList";

export const metadata: Metadata = { title: "Сохранённые поиски" };

export default async function AccountSearchesPage() {
  const session = await getSession();
  if (!session) redirect("/login?returnUrl=/account/searches");

  const searches = await getSavedSearches();

  return <SavedSearchesList initialData={searches} />;
}
