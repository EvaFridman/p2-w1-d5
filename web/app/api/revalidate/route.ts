import { revalidateTag } from "next/cache";

const allowedTags = new Set(["listings", "districts"]);

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || authorization !== `Bearer ${secret}`)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { tag?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tag = body.tag;
  if (!tag || !allowedTags.has(tag))
    return Response.json({ error: "Invalid tag" }, { status: 400 });
  revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: true, tag });
}
