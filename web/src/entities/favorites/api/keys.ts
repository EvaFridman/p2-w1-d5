export const favoriteKeys = {
  all: ["favorites"] as const,
  favoritesIds: () => [...favoriteKeys.all, "ids"] as const,
};
