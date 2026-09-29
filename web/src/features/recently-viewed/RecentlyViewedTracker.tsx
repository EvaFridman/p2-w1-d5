"use client";

import { useEffect } from "react";
import { useAppStore } from "@/shared/providers/app-store-provider";

type Props = {
  listingId: number;
};

export function RecentlyViewedTracker({ listingId }: Props) {
  const addRecentlyViewedId = useAppStore((state) => state.addRecentlyViewedId);

  useEffect(() => {
    addRecentlyViewedId(String(listingId));
  }, [listingId, addRecentlyViewedId]);

  return null;
}
