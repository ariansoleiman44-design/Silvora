"use server";

import { revalidatePath } from "next/cache";
import {
  getQuote,
  isQuoteStatus,
  recordAudit,
  setQuoteNote,
  setQuoteStatus,
} from "@/lib/server/admin-data";
import { requireAdmin } from "@/lib/server/admin-guard";

/**
 * Writes from the request detail screen.
 *
 * Each action verifies the session itself via requireAdmin(). proxy.ts
 * is still the primary gate, but a Server Action is a POST endpoint
 * reachable without the page it appears on ever being rendered by the
 * caller — and trusting the proxy alone was already proven wrong once.
 * See lib/server/admin-guard.ts.
 */

export async function updateStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const reference = String(formData.get("reference") ?? "");
  const status = formData.get("status");

  if (!reference || !isQuoteStatus(status)) return;

  const before = await getQuote(reference);
  if (!before || before.status === status) return;

  await setQuoteStatus(reference, status);
  await recordAudit({
    action: "quote.status",
    target: reference,
    before: { status: before.status },
    after: { status },
  });

  revalidatePath(`/admin/requests/${reference}`);
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}

export async function updateNote(formData: FormData): Promise<void> {
  await requireAdmin();
  const reference = String(formData.get("reference") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!reference) return;

  const before = await getQuote(reference);
  if (!before || before.internal_note === note) return;

  await setQuoteNote(reference, note);
  // The note itself is not copied into the audit log: it is staff
  // commentary about a named buyer, and duplicating it into a second
  // table only widens where that sits.
  await recordAudit({
    action: "quote.note",
    target: reference,
    before: { length: before.internal_note.length },
    after: { length: note.length },
  });

  revalidatePath(`/admin/requests/${reference}`);
}
