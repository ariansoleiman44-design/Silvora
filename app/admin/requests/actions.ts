"use server";

import { revalidatePath } from "next/cache";
import {
  getQuote,
  isQuoteStatus,
  recordAudit,
  setQuoteNote,
  setQuoteStatus,
} from "@/lib/server/admin-data";

/**
 * Writes from the request detail screen.
 *
 * Both actions are guarded by proxy.ts like every other /admin path —
 * a server action is reached through a POST to the page it lives on,
 * so the same session check applies.
 */

export async function updateStatus(formData: FormData): Promise<void> {
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
