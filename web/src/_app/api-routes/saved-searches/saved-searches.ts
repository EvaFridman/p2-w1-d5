import { getSavedSearches } from "@/entities/saved-search/api";

export async function GET() {
  return Response.json(await getSavedSearches());
}
