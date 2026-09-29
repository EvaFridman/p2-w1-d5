import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sid = request.cookies.get("sid")?.value;

  if (!sid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
