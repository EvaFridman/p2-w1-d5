import { getMyViewings } from "@/entities/viewing/api";
import { getSession } from "@/shared/session";
import { getStringParam } from "@/shared/lib/params";
import type { ViewingStatus } from "@/entities/viewing/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json([]);

  const { searchParams } = new URL(request.url);

  const statusParam = searchParams.get("status") ?? undefined;
  const resolvedStatus = getStringParam(statusParam);

  const params = {
    page: Number(searchParams.get("page")) || undefined,
    limit: Number(searchParams.get("limit")) || undefined,
    status: resolvedStatus ? (resolvedStatus as ViewingStatus) : undefined,
  };

  try {
    const result = await getMyViewings(params);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Не удалось загрузить заявки на просмотр" }, { status: 500 });
  }
}
