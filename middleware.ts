import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import { pickLocaleFromAcceptLanguage } from "@/lib/i18n/resolve-locale";
import { LAST_HOUSE_ID_KEY, LAST_HOUSE_MAX_AGE_SEC } from "@/lib/last-house-preference";

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
    const safePath =
      pathname.startsWith("//") || pathname.includes("\0") ? "/" : pathname.length > 2048 ? "/" : pathname;
    url.searchParams.set("callbackUrl", safePath);
    const res = NextResponse.redirect(url);
    return withLocaleCookie(req, res);
  }

  const res = NextResponse.next();
  if (pathname === "/case") {
    res.headers.set("Cache-Control", "private, no-store, must-revalidate");
  }

  /** Ultima casa visitata: deve essere impostata in middleware così esiste già al primo GET (prima dell’hydration). */
  if (isLoggedIn) {
    const casaMatch = pathname.match(/^\/casa\/([^/]+)/);
    const houseId = casaMatch?.[1]?.trim();
    if (houseId && houseId.length > 0 && houseId.length < 200) {
      res.cookies.set(LAST_HOUSE_ID_KEY, houseId, {
        path: "/",
        maxAge: LAST_HOUSE_MAX_AGE_SEC,
        sameSite: "lax",
        secure: req.nextUrl.protocol === "https:",
      });
    }
  }

  return withLocaleCookie(req, res);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
