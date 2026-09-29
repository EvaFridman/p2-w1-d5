import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getMyViewings } from "@/entities/viewing/api";
import { getSession } from "@/shared/session";
import { Loader } from "@/shared/ui";
import { ViewingsList } from "@/_pages/viewings/ViewingsList";

async function AccountViewingsContent() {
  const session = await getSession();
  if (!session) redirect("/login?returnUrl=/account/viewings");
  const isAuthenticated = session !== null;
  const viewings = await getMyViewings();

  return <ViewingsList initialData={viewings} isAuthenticated={isAuthenticated} />;
}

export default function AccountViewingsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AccountViewingsContent />
    </Suspense>
  );
}
