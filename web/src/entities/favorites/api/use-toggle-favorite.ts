import { useMutation, useQueryClient } from "@tanstack/react-query";
import { favoriteKeys } from "@/entities/favorites/api/keys";
import { toggleFavorite } from "@/entities/favorites/api/actions";

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const queryKey = favoriteKeys.all;

  return useMutation({
    mutationFn: async ({
      listingId,
      currentStatus,
    }: {
      listingId: number;
      currentStatus: boolean;
    }) => {
      try {
        const result = await toggleFavorite(listingId, currentStatus);
        if (result.error) throw new Error(result.error);
        return { listingId, currentStatus };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Сетевая ошибка. Проверьте подключение.";
        throw new Error(errorMessage);
      }
    },

    onMutate: async ({ listingId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFavorites = queryClient.getQueryData<number[]>(queryKey) ?? [];
      const isAlreadyFavorite = previousFavorites.includes(listingId);
      const nextFavorites = isAlreadyFavorite
        ? previousFavorites.filter((id) => id !== listingId)
        : [...previousFavorites, listingId];
      queryClient.setQueryData<number[]>(queryKey, nextFavorites);

      return { previousFavorites };
    },

    onError: (error, variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKey, context.previousFavorites);
      }
      alert(error.message || "Не удалось изменить избранное. Попробуйте ещё раз.");
    },

    onSuccess: (data) => {
      const currentFavorites = queryClient.getQueryData<number[]>(queryKey) ?? [];
      const isFavoriteNow = !data.currentStatus;
      const updatedFavorites = isFavoriteNow
        ? [...currentFavorites.filter((id) => id !== data.listingId), data.listingId]
        : currentFavorites.filter((id) => id !== data.listingId);

      queryClient.setQueryData(queryKey, updatedFavorites);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey, refetchType: "none" });
    },
  });
}
