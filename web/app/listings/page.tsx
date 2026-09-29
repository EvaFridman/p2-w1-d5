import type { Metadata } from "next";

import { ListingsPage } from "@/_pages/listings/ListingsPage";

export const metadata: Metadata = { title: "Объявления" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <ListingsPage searchParams={params} />;
}
