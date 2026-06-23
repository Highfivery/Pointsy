import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

/**
 * Edge proxy (Next 16's renamed middleware): gate protected routes and bounce
 * signed-in users away from the auth pages. Uses the edge-safe token verifier
 * (jose) — no DB access here; pages re-check the session (and role)
 * server-side as defense in depth.
 */
const PARENT_PREFIXES = ["/dashboard", "/manage", "/award"];
const KID_PREFIXES = ["/me", "/redeem"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session =
    token && secret ? await verifySessionToken(token, secret) : null;

  const inParentArea = matches(pathname, PARENT_PREFIXES);
  const inKidArea = matches(pathname, KID_PREFIXES);

  if ((inParentArea || inKidArea) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = inKidArea ? "/enter" : "/sign-in";
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && session) {
    const url = req.nextUrl.clone();
    url.pathname = session.role === "kid" ? "/me" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/manage/:path*",
    "/award/:path*",
    "/me/:path*",
    "/redeem/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
