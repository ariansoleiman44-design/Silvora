import { NextResponse, type NextRequest } from "next/server";
import { EXPORT_LIMIT, isQuoteStatus, quotesForExport, recordAudit } from "@/lib/server/admin-data";
import { isSupabaseConfigured } from "@/lib/server/supabase";

/**
 * CSV export of the inbox.
 *
 * Behind the same proxy guard as every other /admin path. The file
 * contains buyer names, phone numbers and email addresses, so treat a
 * download as a copy of personal data leaving the system — it should
 * not be emailed around or left in a shared folder.
 */

/**
 * RFC 4180 quoting, plus one addition: a field starting with =, +, -
 * or @ is prefixed with an apostrophe.
 *
 * Spreadsheets treat those as the start of a formula, so a "company
 * name" of `=HYPERLINK(...)` becomes executable content in Excel the
 * moment someone opens the export. The buyer controls that string.
 */
function csvField(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

const COLUMNS = [
  "reference",
  "created_at",
  "status",
  "order_type",
  "company",
  "buyer_name",
  "buyer_email",
  "buyer_phone",
  "country",
  "line_count",
  "internal_note",
] as const;

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return new NextResponse("No database configured.", { status: 503 });
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const status = isQuoteStatus(statusParam) ? statusParam : "all";
  const search = request.nextUrl.searchParams.get("q") ?? "";

  const rows = await quotesForExport({ status, search });

  const header = COLUMNS.join(",");
  const body = rows
    .map((row) => COLUMNS.map((column) => csvField(row[column])).join(","))
    .join("\r\n");

  // A BOM so Excel opens UTF-8 correctly — without it Arabic and
  // Kurdish company names arrive as mojibake.
  const csvBody = `﻿${header}\r\n${body}\r\n`;

  const truncated = rows.length >= EXPORT_LIMIT;

  await recordAudit({
    action: "quote.export",
    target: search ? `${status} q=${search}` : status,
    after: { rows: rows.length, truncated },
  });

  /*
   * A silent cap reads as "this is everything". If the export hit the
   * limit, say so in the file itself — the person downloading it is the
   * only one who can act on it.
   */
  const notice = truncated
    ? `\r\n"NOTE: this export was capped at ${EXPORT_LIMIT} rows. Narrow the filter or search to get the rest."\r\n`
    : "";

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csvBody + notice, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="corn-fodder-requests-${status}-${stamp}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
