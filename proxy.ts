import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  FAMILY_COOKIE,
  FAMILY_COOKIE_MAX_AGE,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/token";

/**
 * Edge proxy (Next 16's renamed middleware): gate protected routes by presence
 * AND role, bounce signed-in users away from the auth pages, and keep the
 * device→family cookie in sync. Uses the edge-safe token verifier (jose) — no DB
 * access here; pages re-check the session and role server-side as defense in
 * depth.
 */
const PARENT_PREFIXES = ["/dashboard", "/manage", "/award"];
const KID_PREFIXES = ["/me", "/redeem"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Heal the device→family cookie for any signed-in request that lacks it (e.g.
 * sessions created before this cookie existed) so the picker keeps working
 * after sign-out.
 */
function finish(
  res: NextResponse,
  req: NextRequest,
  session: SessionPayload | null,
): NextResponse {
  if (session && !req.cookies.get(FAMILY_COOKIE)) {
    res.cookies.set(FAMILY_COOKIE, session.familyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: FAMILY_COOKIE_MAX_AGE,
    });
  }
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session =
    token && secret ? await verifySessionToken(token, secret) : null;

  const inParentArea = matches(pathname, PARENT_PREFIXES);
  const inKidArea = matches(pathname, KID_PREFIXES);

  // Not signed in → send to the relevant sign-in.
  if ((inParentArea || inKidArea) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = inKidArea ? "/enter" : "/sign-in";
    return NextResponse.redirect(url);
  }

  // Signed in but wrong role → your own area. This is what stops a kid from
  // opening the parent dashboard (and vice-versa) by URL.
  if (session && inParentArea && session.role !== "parent") {
    const url = req.nextUrl.clone();
    url.pathname = "/me";
    return finish(NextResponse.redirect(url), req, session);
  }
  if (session && inKidArea && session.role !== "kid") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return finish(NextResponse.redirect(url), req, session);
  }

  // Already signed in → keep them off the auth pages.
  if (AUTH_PAGES.includes(pathname) && session) {
    const url = req.nextUrl.clone();
    url.pathname = session.role === "kid" ? "/me" : "/dashboard";
    return finish(NextResponse.redirect(url), req, session);
  }

  return finish(NextResponse.next(), req, session);
}

export const config = {
  matcher: [
    "/",
    "/enter",
    "/dashboard/:path*",
    "/manage/:path*",
    "/award/:path*",
    "/me/:path*",
    "/redeem/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
