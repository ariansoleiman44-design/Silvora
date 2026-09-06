import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, sessionCookieOptions } from "@/lib/server/admin-auth";

/**
 * Sign out.
 *
 * POST only. A GET would let any image tag or prefetched link on any
 * page sign a member of staff out, which is a small but entirely
 * avoidable nuisance.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  response.cookies.set(ADMIN_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
