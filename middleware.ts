import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import { pickLocaleFromAcceptLanguage } from "@/lib/i18n/resolve-locale";

const { auth } = NextAuth(authConfig);

function withLocaleCookie(req: NextRequest, res: NextResponse) {
  if (req.cookies.get(LOCALE_COOKIE_NAME)?.value) return res;
  const loc = pickLocaleFromAcceptLanguage(req.headers.get("accept-language"));
  res.cookies.set(LOCALE_COOKIE_NAME, loc, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
  });
  return res;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/accedi") ||
    pathname.startsWith("/registrati") ||
    pathname.startsWith("/verifica-email") ||
    pathname.startsWith("/reimposta-password") ||
    pathname.startsWith("/invito-casa") ||
    pathname.startsWith("/trasferimento-proprieta") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/calendar/feed/") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/icon");

  if (!isLoggedIn && !isPublic) {
    const url = new URL("/accedi", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    const res = NextResponse.redirect(url);
    return withLocaleCookie(req, res);
  }

  const res = NextResponse.next();
  return withLocaleCookie(req, res);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
