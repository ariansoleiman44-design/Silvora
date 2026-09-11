/**
 * FIELD LIMITS — ONE SOURCE, BOTH SIDES
 * --------------------------------------------------------------------
 * The server refuses a submission whose free text is over length, which
 * is the right call: silently truncating a buyer's "the gate is 3m wide,
 * deliver before the 15th" would lose the part that mattered, and they
 * would never know.
 *
 * But a rejection the buyer could not have seen coming is a dead end —
 * especially on the notes field, which sits several steps back in the
 * wizard. So the same numbers cap the inputs in the browser: the
 * browser stops them at the limit, and the server check becomes the
 * backstop it should be rather than the first time anyone finds out.
 *
 * This module has no imports at all, so both a client component and
 * lib/server/validate-quote.ts can use it.
 */

export const FIELD_LIMITS = {
  /** Rejected before parsing — see the route handler. */
  maxBodyBytes: 128 * 1024,
  maxItems: 50,
  maxQuantity: 1_000_000,
  /** Multi-line free text: the buyer's notes and delivery notes. */
  maxNotes: 5_000,
  /** Single-line fields: names, companies, regions. */
  maxShortText: 200,
  /** The practical maximum length of an email address. */
  maxEmail: 254,
  /** Phone and WhatsApp, long enough for any international format. */
  maxPhone: 40,
} as const;
