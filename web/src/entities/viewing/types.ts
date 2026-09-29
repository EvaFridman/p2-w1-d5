import type { PublicPhotoType } from "@/entities/listing/types";

export type ViewingStatus = "CREATED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CLOSED";

export type PublicViewingType = {
  id: number;
  preferredAt: string;
  status: ViewingStatus;
  comment: string | null;
  listing: {
    id: number;
    title: string;
    photos: PublicPhotoType[];
    agent: {
      id: number;
      name: string;
      phone: string | null;
      email: string;
    };
  };
};

export type GetMyViewingsParams = {
  page?: number;
  limit?: number;
  status?: ViewingStatus;
};
