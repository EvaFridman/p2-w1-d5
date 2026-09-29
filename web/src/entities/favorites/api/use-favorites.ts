import { useQuery } from "@tanstack/react-query";
import { favoriteKeys } from "./keys";
import { http } from "@/shared/api/http";

export function useFavoriteIds(isAuthenticated: boolean) {
  return useQuery<number[]>({
    queryKey: favoriteKeys.all,
    queryFn: async () => {
      const { data } = await http.get<number[]>("/favorites/ids");
      return data;
    },
    enabled: isAuthenticated,
    initialData: !isAuthenticated ? [] : undefined,
    staleTime: 60 * 1000,
  });
}
