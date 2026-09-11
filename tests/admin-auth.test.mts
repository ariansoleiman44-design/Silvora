import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  adminAuthStatus,
  checkLoginAttempt,
  clearLoginAttempts,
  createSessionToken,
  hashPassword,
  sessionCookieOptions,
  verifyPassword,
  verifySessionToken,
} from "../lib/server/admin-auth.ts";

/**
 * ADMIN AUTHENTICATION
 * --------------------------------------------------------------------
 * This is the only thing standing between the public internet and every
 * buyer's name, phone number and email address. It reads its
 * configuration from the environment, so each test sets the environment
 * it needs and restores it afterwards.
 */

const SECRET = "0".repeat(64);

function withEnv<T>(env: Record<string, string | undefined>, fn: () => T): T {
  const previous: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    previous[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const configured = (fn: () => void) =>
  withEnv({ ADMIN_PASSWORD_HASH: hashPassword("correct horse battery"), ADMIN_SESSION_SECRET: SECRET }, fn);

/* ------------------------------------------------------- password */

test("the correct password is accepted", () => {
  configured(() => assert.equal(verifyPassword("correct horse battery"), true));
});

test("a wrong password is rejected", () => {
  configured(() => assert.equal(verifyPassword("wrong"), false));
});

test("the stored value is a hash, never the password", () => {
  const stored = hashPassword("my password");
  assert.ok(stored.startsWith("scrypt:"));
  assert.ok(!stored.includes("my password"));
});

test("the same password hashes differently every time", () => {
  // A per-password salt: two staff choosing the same password must not
  // produce the same stored value.
  assert.notEqual(hashPassword("same"), hashPassword("same"));
});

test("a malformed stored hash is rejected rather than throwing", () => {
  withEnv({ ADMIN_PASSWORD_HASH: "garbage", ADMIN_SESSION_SECRET: SECRET }, () => {
    assert.equal(verifyPassword("anything"), false);
  });
});

/* ---------------------------------------------------------- session */

test("a freshly minted session verifies", () => {
  configured(() => assert.equal(verifySessionToken(createSessionToken()), true));
});

test("a tampered signature is rejected", () => {
  configured(() => {
    const token = createSessionToken();
    assert.equal(verifySessionToken(`${token.slice(0, -1)}X`), false);
  });
});

test("a tampered payload is rejected", () => {
  configured(() => {
    const [, signature] = createSessionToken().split(".");
    const forged = Buffer.from(JSON.stringify({ exp: Date.now() + 1e9 })).toString("base64url");
    assert.equal(verifySessionToken(`${forged}.${signature}`), false);
  });
});

test("REGRESSION: a token signed with the wrong secret is rejected", () => {
  configured(() => {
    const payload = Buffer.from(JSON.stringify({ iat: Date.now(), exp: Date.now() + 1e6 })).toString("base64url");
    const signature = createHmac("sha256", "attacker guess").update(payload).digest("base64url");
    assert.equal(verifySessionToken(`${payload}.${signature}`), false);
  });
});

test("an expired but correctly signed token is rejected", () => {
  configured(() => {
    const past = Date.now() - 1000;
    assert.equal(verifySessionToken(createSessionToken(past - 9 * 60 * 60 * 1000)), false);
  });
});

test("garbage and empty tokens are rejected", () => {
  configured(() => {
    for (const token of ["", "...", "a.b", "notbase64.notbase64", undefined]) {
      assert.equal(verifySessionToken(token as string | undefined), false, `rejected: ${token}`);
    }
  });
});

test("no session verifies while the panel is unconfigured", () => {
  // Otherwise an empty ADMIN_SESSION_SECRET would make every HMAC
  // computable, and any forged cookie would be accepted.
  configured(() => {
    const token = createSessionToken();
    withEnv({ ADMIN_PASSWORD_HASH: undefined, ADMIN_SESSION_SECRET: undefined }, () => {
      assert.equal(verifySessionToken(token), false);
    });
  });
});

/* ---------------------------------------------------- configuration */

test("a half-configured panel refuses to run", () => {
  withEnv({ ADMIN_PASSWORD_HASH: hashPassword("x".repeat(12)), ADMIN_SESSION_SECRET: undefined }, () => {
    const status = adminAuthStatus();
    assert.equal(status.configured, false);
  });
});

test("a short session secret is refused", () => {
  withEnv({ ADMIN_PASSWORD_HASH: hashPassword("x".repeat(12)), ADMIN_SESSION_SECRET: "short" }, () => {
    assert.equal(adminAuthStatus().configured, false);
  });
});

/* ---------------------------------------------------------- cookie */

test("the session cookie cannot be read by script or sent cross-site", () => {
  const options = sessionCookieOptions(true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "strict");
  assert.equal(options.secure, true);
  assert.equal(options.path, "/admin");
});

/* -------------------------------------------------------- throttle */

test("login attempts are throttled, and a success clears the count", () => {
  const key = "test-ip-throttle";
  clearLoginAttempts(key);
  let lastAllowed = true;
  for (let i = 0; i < 12; i++) lastAllowed = checkLoginAttempt(key).allowed;
  assert.equal(lastAllowed, false, "must lock out after repeated failures");

  clearLoginAttempts(key);
  assert.equal(checkLoginAttempt(key).allowed, true, "a correct password clears the count");
  clearLoginAttempts(key);
});

test("throttling is per client, not global", () => {
  // One attacker must not be able to lock every member of staff out.
  const attacker = "attacker-ip";
  const staff = "staff-ip";
  clearLoginAttempts(attacker);
  clearLoginAttempts(staff);
  for (let i = 0; i < 12; i++) checkLoginAttempt(attacker);
  assert.equal(checkLoginAttempt(staff).allowed, true);
  clearLoginAttempts(attacker);
  clearLoginAttempts(staff);
});
