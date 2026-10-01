import { apiProxy } from "@/shared/api/api-fetch";

type Context = { params: Promise<{ path: string[] }> };

function toApiPath(prefix: string, segments: string[]): string | null {
  if (segments.some((segment) => segment === "." || segment === "..")) return null;
  return `${prefix}/${segments.map(encodeURIComponent).join("/")}`;
}

export async function getFile(_request: Request, { params }: Context) {
  const path = toApiPath("/files", (await params).path);
  if (!path) return new Response(null, { status: 400 });
  return apiProxy(path);
}

export async function getStatic(_request: Request, { params }: Context) {
  const path = toApiPath("/static", (await params).path);
  if (!path) return new Response(null, { status: 400 });
  return apiProxy(path, { skipAuth: true });
}
