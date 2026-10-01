"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destroyAllSessions, sessions } from "@/shared/session/store";
import { getSession } from "@/shared/session";
import type { AuthUser } from "@/shared/session/types";

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

function getRefreshToken(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return null;

  const match = setCookie.match(/(?:^|,\s*)refreshToken=([^;]+)/);
  return match?.[1] ?? null;
}

function getSafeReturnUrl(returnUrl?: string): string {
  if (
    !returnUrl ||
    !returnUrl.startsWith("/") ||
    returnUrl.startsWith("//") ||
    returnUrl.includes("\\")
  )
    return "/";
  return returnUrl;
}

async function createSession(response: Response): Promise<AuthUser | null> {
  const result = await response.json();
  const data = result.data ?? result;
  const refreshToken = getRefreshToken(response);

  if (!refreshToken) return null;

  const sessionId = await sessions.create({
    accessToken: data.accessToken,
    refreshToken,
    user: data.user,
  });

  const cookieStore = await cookies();

  cookieStore.set("sid", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return data.user;
}

export async function login(
  data: LoginData,
  returnUrl?: string,
): Promise<{ error?: string; blocked?: boolean; retryAfter?: number }> {
  let response: Response;

  try {
    response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    return { error: "Не удалось выполнить вход" };
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after-login") ?? 0);

    return {
      error: "Вход приостановлен",
      blocked: true,
      retryAfter,
    };
  }

  if (!response.ok) return { error: "Неверная почта или пароль" };

  const user = await createSession(response);

  if (!user) return { error: "Не удалось выполнить вход" };

  redirect(getSafeReturnUrl(returnUrl));
}

export async function register(data: RegisterData): Promise<{ error?: string }> {
  let response: Response;

  try {
    response = await fetch(`${process.env.API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);

      if (response.status === 409 && result?.error?.code === "USER_PHONE_TAKEN")
        return { error: "Пользователь с таким телефоном уже существует" };
      if (response.status === 409) return { error: "Пользователь с такой почтой уже существует" };

      return { error: result?.error?.message ?? "Не удалось создать аккаунт" };
    }
  } catch {
    return { error: "Не удалось создать аккаунт" };
  }

  const user = await createSession(response);

  if (!user) return { error: "Не удалось создать аккаунт" };

  redirect("/");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  const cookieStore = await cookies();

  if (session) {
    await sessions.destroy(session.id);

    try {
      await fetch(`${process.env.API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
    } catch {}
  }

  cookieStore.delete("sid");
}

export async function logoutAll(): Promise<void> {
  const session = await getSession();
  if (session) await destroyAllSessions(session.user.id);
  const cookieStore = await cookies();
  cookieStore.delete("sid");
}
