/**
 * JSON-LD script tag(s).
 *
 * An array is emitted as one <script> per object rather than a single
 * script containing a top-level array. Both are technically valid, but a
 * bare array has no `@context` of its own, and consumers that read
 * `data["@context"]` on it throw. One document per script is the
 * unambiguous form.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const documents = Array.isArray(data) ? data : [data];
  return (
    <>
      {documents.map((doc, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON-LD must be raw JSON; React would otherwise escape it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(doc).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
