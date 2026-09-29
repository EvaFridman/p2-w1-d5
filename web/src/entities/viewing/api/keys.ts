import { type GetMyViewingsParams } from "../types";

export const viewingKeys = {
  all: ["viewings"] as const,
  myAll: () => [...viewingKeys.all, "my"] as const,
  myList: (params: GetMyViewingsParams) => [...viewingKeys.myAll(), params] as const,
};
