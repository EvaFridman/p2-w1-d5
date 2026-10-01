export const savedSearchKeys = {
  all: ["saved-searches"] as const,
  list: () => [...savedSearchKeys.all, "list"] as const,
};
