import "server-only";

import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import { getSession } from "../session";
import { getRequestId } from "../request-id";
import { sessions } from "../session/store";
import { ApiError } from "./errors";

type QueryValueType = string | number | boolean | string[] | number[] | undefined;

export type RequestOptionsType = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValueType>;
  headers?: Record<string, string>;
  cache?: RequestInit["cache"];
  next?: RequestInit["next"];
  skipAuth?: boolean;
};

function getRefreshToken(response: Response): string | null {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.() ?? [];
  const cookie =
    cookies.find((item) => item.startsWith("refreshToken=")) ?? headers.get("set-cookie");
  if (!cookie) return null;
  const match = cookie.match(/^refreshToken=([^;]+)/);
  return match?.[1] ?? null;
}

async function request<T>(
  path: string,
  options: RequestOptionsType = {},
  isRetry = false,
): Promise<T> {
  const baseUrl = process.env.API_URL;
  const method = options.method ?? "GET";
  let url = `${baseUrl}${path}`;

  if (options.query) {
    const searchParams = new URLSearchParams();

    Object.entries(options.query).forEach(([key, value]) => {
      if (value === undefined) return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          searchParams.append(key, String(item));
        });
        return;
      }

      searchParams.append(key, String(value));
    });

    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (["POST", "PUT", "PATCH"].includes(method) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (process.env.NEXT_BUILD_SECRET) headers["X-Build-Request"] = process.env.NEXT_BUILD_SECRET;

  if (!headers["x-request-id"]) headers["x-request-id"] = getRequestId();

  Sentry.setTag("request_id", headers["x-request-id"]);

  const session = options.skipAuth ? null : await getSession();

  if (session) headers["Authorization"] = `Bearer ${session.accessToken}`;

  try {
    const config: RequestInit = {
      method,
      headers,
      cache: options.cache,
      next: options.next,
    };

    if (options.body !== undefined) config.body = JSON.stringify(options.body);

    const response = await fetch(url, config);

    if (response.status === 401 && session && !isRetry) {
      const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refreshToken=${session.refreshToken}`,
          "x-request-id": headers["x-request-id"],
        },
      });

      if (!refreshResponse.ok) {
        await sessions.destroy(session.id);
        redirect("/login");
      }

      const refreshResult = await refreshResponse.json();
      const refreshData = refreshResult.data ?? refreshResult;
      const refreshToken = getRefreshToken(refreshResponse);

      if (!refreshToken) {
        await sessions.destroy(session.id);
        redirect("/login");
      }

      await sessions.update(session.id, {
        accessToken: refreshData.accessToken,
        refreshToken,
        user: refreshData.user,
      });

      return request<T>(path, options, true);
    }

    if (!response.ok) {
      try {
        const errorResult = await response.json();

        if (errorResult?.error) {
          throw new ApiError(
            response.status,
            errorResult.error.message,
            errorResult.error.details || null,
            errorResult.error.code || null,
          );
        }
      } catch (error) {
        if (error instanceof ApiError) throw error;
      }

      throw new ApiError(response.status, `Error! Status: ${response.status}`);
    }

    const result = await response.json();

    if (result && typeof result === "object" && "error" in result && result.error) {
      throw new ApiError(
        400,
        result.error.message,
        result.error.details || null,
        result.error.code || null,
      );
    }

    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw error;
  }
}

export async function apiFetch<T>(path: string, options: RequestOptionsType = {}): Promise<T> {
  const result = await request<{ data: T }>(path, options);
  return result.data;
}

const PROXIED_HEADERS = [
  "content-type",
  "content-length",
  "cache-control",
  "etag",
  "last-modified",
];

export async function apiProxy(
  path: string,
  options: Pick<RequestOptionsType, "skipAuth"> = {},
): Promise<Response> {
  const headers: Record<string, string> = { "x-request-id": getRequestId() };
  const session = options.skipAuth ? null : await getSession();
  if (session) headers["Authorization"] = `Bearer ${session.accessToken}`;

  const response = await fetch(`${process.env.API_URL}${path}`, { headers, cache: "no-store" });

  const proxiedHeaders = new Headers();
  for (const name of PROXIED_HEADERS) {
    const value = response.headers.get(name);
    if (value) proxiedHeaders.set(name, value);
  }

  return new Response(response.body, { status: response.status, headers: proxiedHeaders });
}

export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestOptionsType = {},
): Promise<T> {
  return request<T>(path, options);
}
