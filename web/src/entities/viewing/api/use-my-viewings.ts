import { useQuery } from "@tanstack/react-query";
import { viewingKeys } from "./keys";
import { http } from "@/shared/api/http";
import type { PublicViewingType, ViewingStatus } from "../types";

interface Props {
  status?: ViewingStatus;
  initialData: PublicViewingType[];
  isAuthenticated: boolean;
}

export function useMyViewings({ status, initialData, isAuthenticated }: Props) {
  return useQuery<PublicViewingType[]>({
    queryKey: viewingKeys.myList({ status }),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (status) searchParams.set("status", status);
      const { data } = await http.get<PublicViewingType[]>(
        `/viewings/my?${searchParams.toString()}`,
      );
      return data;
    },
    enabled: isAuthenticated,
    initialData: !isAuthenticated ? [] : status === undefined ? initialData : undefined,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}
