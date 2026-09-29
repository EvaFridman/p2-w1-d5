import { getSession } from "@/shared/session";

export async function GET() {
  const session = await getSession();
  return Response.json(session?.user ?? null);
}
