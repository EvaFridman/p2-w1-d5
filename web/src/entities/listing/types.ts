export type PublicListingDealType = "sale" | "rent";

export type PublicListingPropertyType = "flat" | "house" | "room" | "commercial";

export type PublicPhotoType = {
  id: number;
  fileName: string;
  externalUrl: string | null;
  position: number;
  isCover: boolean;
};

export type PublicListingType = {
  id: number;
  title: string;
  description: string | null;
  agent: { id: number; name: string; avatarFileName: string | null };
  price: string;
  area: string;
  rooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  dealType: PublicListingDealType;
  propertyType: PublicListingPropertyType;
  address: string;
  publishedAt: string;
  district: { id: number; title: string; city: string };
  photos: PublicPhotoType[];
};

export type PublicListingsMetaType = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PublicListingsResponseType = {
  items: PublicListingType[];
  meta: PublicListingsMetaType;
};

export type ListingsApiResponseType = {
  data: PublicListingType[];
  meta: PublicListingsMetaType;
};

export type ListingQueryType = Record<
  string,
  string | number | boolean | string[] | number[] | undefined
>;
