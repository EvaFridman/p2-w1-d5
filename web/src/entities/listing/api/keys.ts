import { type ListingQueryType } from "../types";

export const listingKeys = {
  all: ["listings"] as const,
  lists: () => [...listingKeys.all, "list"] as const,

  listWithFilters: (filters: ListingQueryType) => [...listingKeys.lists(), filters] as const,

  details: () => [...listingKeys.all, "detail"] as const,
  detail: (id: string | number) => [...listingKeys.details(), id] as const,

  busyTimes: (id: string | number) => [...listingKeys.detail(id), "busy-times"] as const,

  agents: ["agents"] as const,
  agentPhone: (id: string | number) => [...listingKeys.agents, "phone", id] as const,
};
