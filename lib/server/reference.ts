import { randomInt } from "node:crypto";

/**
 * QUOTE REFERENCE
 * --------------------------------------------------------------------
 * The SERVER is authoritative. The browser mints a local reference so a
 * buyer can print or copy a draft before submitting, but the value that
 * matters — the one in the confirmation, the email and the record — is
 * issued here and returned in the response.
 *
 * Shape: SLV-YYMMDD-XXXX
 *   SLV     brand prefix
 *   YYMMDD  submission date, so a reference is human-sortable
 *   XXXX    random, from an unambiguous alphabet
 *
 * Not security-sensitive: a reference identifies a request in an email
 * or over the phone, it does not authorise anything. It must be safe to
 * read aloud, print, and paste into WhatsApp.
 */

/** No I, O, 0, 1 — they are misread over a phone line. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 4): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

export function createServerReference(prefix = "SLV", now = new Date()): string {
  const y = now.getUTCFullYear().toString().slice(-2);
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${prefix}-${y}${m}${d}-${randomSuffix()}`;
}

/**
 * Collision note: 32^4 ≈ 1.05M suffixes per day. At realistic RFQ volume
 * a collision is vanishingly unlikely, but references are not unique
 * keys — persistence should use its own primary key and may treat the
 * reference as a human label. If you later need a guarantee, check the
 * reference against your store before returning it.
 */
export const REFERENCE_PATTERN = /^[A-Z]{2,4}-\d{6}-[A-Z2-9]{4}$/;
