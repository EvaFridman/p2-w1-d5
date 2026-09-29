import { listingApi } from "@/entities/listing/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = {
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 20,
    dealType: searchParams.get("dealType") || undefined,
    propertyType: searchParams.get("propertyType") || undefined,
    districtId: searchParams.get("districtId") || undefined,
    rooms: searchParams.getAll("rooms"),
    priceMin: searchParams.get("priceMin") || undefined,
    priceMax: searchParams.get("priceMax") || undefined,
    areaMin: searchParams.get("areaMin") || undefined,
    areaMax: searchParams.get("areaMax") || undefined,
    search: searchParams.get("search") || undefined,
    sortBy: searchParams.get("sortBy") || "publishedAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
  };

  const result = await listingApi.getListingsWithMeta(query);

  return Response.json(result);
}
