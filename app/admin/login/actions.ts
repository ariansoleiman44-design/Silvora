"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  adminAuthStatus,
  checkLoginAttempt,
  clearLoginAttempts,
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/server/admin-auth";
import { clientKey } from "@/lib/server/guards";
import { recordAudit } from "@/lib/server/admin-data";

export interface LoginState {
  error?: string;
}

/**
 * Only a path within this site, never a full URL. Without this an
 * attacker could send someone a login link that bounces them to
 * another origin after they authenticate.
 */
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  // "//evil.com" is a protocol-relative URL, not a path.
  if (value.startsWith("//")) return "/admin";
  return value;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const status = adminAuthStatus();
  if (!status.configured) {
    return { error: `The panel is not configured: ${status.reason}` };
  }

  const key = clientKey(await headers());
  const attempt = checkLoginAttempt(key);
  if (!attempt.allowed) {
    return {
      error: `Too many attempts. Try again in ${Math.ceil(attempt.retryAfter / 60)} minute(s).`,
    };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return { error: "Enter the admin password." };
  }

  if (!verifyPassword(password)) {
    // Deliberately vague: there is only one account, so naming the
    // failure would only confirm to a guesser that they are on the
    // right endpoint with the wrong secret.
    await recordAudit({ action: "auth.login.failed", target: "-" });
    return { error: "That password was not accepted." };
  }

  clearLoginAttempts(key);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions());
  await recordAudit({ action: "auth.login", target: "-" });

  redirect(safeNext(formData.get("next")));
}
