"use server";

import { revalidatePath } from "next/cache";
import {
  getContact,
  isContactStatus,
  recordAudit,
  setContactNote,
  setContactStatus,
} from "@/lib/server/admin-data";

/** Writes from the enquiry detail screen. Mirrors requests/actions.ts. */

export async function updateContactStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!id || !isContactStatus(status)) return;

  const before = await getContact(id);
  if (!before || before.status === status) return;

  await setContactStatus(id, status);
  await recordAudit({
    action: "contact.status",
    target: id,
    before: { status: before.status },
    after: { status },
  });

  revalidatePath(`/admin/contacts/${id}`);
  revalidatePath("/admin/contacts");
  revalidatePath("/admin");
}

export async function updateContactNote(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!id) return;

  const before = await getContact(id);
  if (!before || before.internal_note === note) return;

  await setContactNote(id, note);
  // Only the length is audited: the note is staff commentary about a
  // named person, and copying it into a second table only widens where
  // that sits.
  await recordAudit({
    action: "contact.note",
    target: id,
    before: { length: before.internal_note.length },
    after: { length: note.length },
  });

  revalidatePath(`/admin/contacts/${id}`);
}
