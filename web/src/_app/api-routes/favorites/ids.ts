import { getSession } from "@/shared/session";
import { apiFetch } from "@/shared/api/api-fetch";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json([]);
  return Response.json(await apiFetch<number[]>("/public/favorites"));
}
