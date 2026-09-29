import { getSession } from "@/shared/session";

import { ViewingRequestForm } from "./ViewingRequestForm";

type Props = {
  listingId: number;
};

export async function ViewingRequestFormContainer({ listingId }: Props) {
  const session = await getSession();

  return <ViewingRequestForm listingId={listingId} user={session?.user ?? null} />;
}
