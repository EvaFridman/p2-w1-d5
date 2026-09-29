import { listingApi } from "@/entities/listing/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await listingApi.getAgentPhone(id);
  return Response.json(result);
}
