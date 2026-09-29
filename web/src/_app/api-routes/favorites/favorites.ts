import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ count: 0 });
  const favoriteIds = await apiFetch<number[]>("/public/favorites");
  return Response.json({ count: favoriteIds.length });
}
