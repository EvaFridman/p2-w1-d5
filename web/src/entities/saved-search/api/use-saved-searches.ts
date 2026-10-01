import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/shared/api/http";
import { savedSearchKeys } from "./keys";
import { createSavedSearch, deleteSavedSearch } from "./actions";
import type { SavedSearchType } from "../types";

export function useSavedSearches(initialData: SavedSearchType[]) {
  return useQuery<SavedSearchType[]>({
    queryKey: savedSearchKeys.list(),
    queryFn: async () => {
      const { data } = await http.get<SavedSearchType[]>("/saved-searches");
      return data;
    },
    initialData,
    staleTime: 60 * 1000,
  });
}

type CreateVariables = { query: string; name: string; returnUrl: string };

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ query, name, returnUrl }: CreateVariables) => {
      const result = await createSavedSearch(query, name, returnUrl);
      if (result.error || !result.savedSearch) throw new Error(result.error);
      return result.savedSearch;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedSearchKeys.all }),
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteSavedSearch(id);
      if (result.error) throw new Error(result.error);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<SavedSearchType[]>(savedSearchKeys.list(), (current) =>
        current?.filter((search) => search.id !== id),
      );
      return queryClient.invalidateQueries({ queryKey: savedSearchKeys.all });
    },
  });
}
