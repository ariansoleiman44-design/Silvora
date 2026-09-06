/**
 * ERROR OBSERVABILITY
 * --------------------------------------------------------------------
 * One adapter point for a future monitoring provider. No provider is
 * installed and none should be added without being asked for.
 *
 * `reportError` is a no-op that logs. To attach Sentry, Bugsnag or
 * anything else later, call `setErrorReporter()` once at startup — no
 * call site needs to change:
 *
 *   setErrorReporter((error, context) => Sentry.captureException(error, { extra: context }));
 *
 * PRIVACY: context must never carry RFQ personal data. Pass a reference,
 * a category and a count — never a name, phone, email or free text. The
 * same rule as analytics (see lib/analytics.ts).
 */

export interface ErrorContext {
  /** Where it happened, e.g. "api/quote". */
  scope: string;
  /** Quote reference, when relevant. Not personal data. */
  reference?: string;
  /** Coarse category for grouping, e.g. "storage", "notify". */
  category?: string;
  [key: string]: string | number | boolean | undefined;
}

export type ErrorReporter = (error: unknown, context: ErrorContext) => void;

let reporter: ErrorReporter | null = null;

export function setErrorReporter(next: ErrorReporter | null): void {
  reporter = next;
}

export function reportError(error: unknown, context: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  // Server logs get the message and the scope, never the payload.
  console.error(`[${context.scope}]`, context.category ?? "error", message, {
    reference: context.reference,
  });
  if (!reporter) return;
  try {
    reporter(error, context);
  } catch {
    /* monitoring must never break the request */
  }
}
