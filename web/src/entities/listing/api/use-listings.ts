import { useInfiniteQuery } from "@tanstack/react-query";
import { listingKeys } from "./keys";
import { PublicListingType, PublicListingsMetaType, PublicListingsResponseType } from "../types";
import { http } from "@/shared/api/http";

type QueryValueType = string | number | string[] | undefined;

export function buildQuery(query: Record<string, QueryValueType>, page: number) {
  const searchParams = new URLSearchParams();

  Object.entries({ ...query, page }).forEach(([key, value]) => {
    if (value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

type Props = {
  query: Record<string, QueryValueType>;
  initialItems: PublicListingType[];
  initialMeta: PublicListingsMetaType;
};

export function useInfiniteListings({ query, initialItems, initialMeta }: Props) {
  return useInfiniteQuery({
    queryKey: listingKeys.listWithFilters(query),
    queryFn: async ({ pageParam }) => {
      const queryString = buildQuery(query, pageParam);
      const { data } = await http.get<PublicListingsResponseType>(`/listings?${queryString}`);
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialData: {
      pages: [{ items: initialItems, meta: initialMeta }],
      pageParams: [1],
    },
    staleTime: 60 * 1000,
  });
}
