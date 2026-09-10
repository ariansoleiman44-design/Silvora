import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/server/admin-auth";

/**
 * SECOND LOCK ON EVERY ADMIN WRITE
 * --------------------------------------------------------------------
 * proxy.ts is the primary gate and it now covers every /admin path
 * unconditionally. This exists because relying on it alone was already
 * proven wrong once: the proxy's matcher excluded any path whose last
 * segment contained a dot, so /admin/requests/gt.A skipped the guard
 * entirely — and with it, the Server Actions rendered on that page.
 * An unauthenticated POST could change a quote's status and overwrite
 * staff notes, using action ids handed out by the same unguarded page.
 *
 * A Server Action is a POST endpoint. It deserves its own check for the
 * same reason a route handler does: it is reachable without the page it
 * appears on ever being rendered by the caller.
 *
 * Throwing rather than returning is deliberate. Every caller is a
 * `void` form action; a silent no-op would look to the operator exactly
 * like a successful save.
 */
export async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    throw new Error("Not authorised.");
  }
}

/** Non-throwing variant, for read paths that want to degrade quietly. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
}
