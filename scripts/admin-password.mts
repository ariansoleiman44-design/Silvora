/**
 * Generate the two secrets the admin panel needs.
 *
 *   npm run admin:password
 *   npm run admin:password -- "my chosen password"
 *
 * Prints ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET. Paste them into
 * your deployment environment — never into the repository.
 *
 * Run with Node 22.6+ (native TypeScript). No dependency, no runner.
 */

import { randomBytes, scryptSync } from "node:crypto";

/*
 * Duplicated from lib/server/admin-auth.ts rather than imported: this
 * script runs under plain Node, which does not resolve the "@/" path
 * alias, and the module imports things that assume a Next runtime. Nine
 * lines of scrypt is a cheaper price than a build step for one script.
 * If you change the hash format, change it in both places.
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Readable but high-entropy: 24 characters from a 58-character alphabet. */
function suggestPassword(): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(24);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const provided = process.argv.slice(2).join(" ").trim();
const password = provided || suggestPassword();

if (provided && provided.length < 12) {
  console.error("\n  Refusing: the password is shorter than 12 characters.");
  console.error("  Run without an argument to have one generated for you.\n");
  process.exit(1);
}

const hash = hashPassword(password);
const secret = randomBytes(32).toString("hex");

console.log(`
SILVORA — ADMIN CREDENTIALS
===========================================================

  Password    ${password}
${provided ? "" : "\n  (generated — save it in your password manager now,\n   it is not stored anywhere and cannot be recovered)\n"}
Add these to your deployment environment:

ADMIN_PASSWORD_HASH=${hash}
ADMIN_SESSION_SECRET=${secret}

===========================================================
  Neither value belongs in the repository. ADMIN_SESSION_SECRET
  signs session cookies — rotating it logs everyone out, which is
  how you revoke access.
`);
