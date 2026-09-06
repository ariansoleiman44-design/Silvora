"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

/**
 * The only client component in the panel that has to be one: the form
 * needs the pending state and the error string back from the action.
 */
export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action}>
      {state.error && (
        <div className="notice notice-error" role="alert">
          <p>{state.error}</p>
        </div>
      )}

      <input type="hidden" name="next" value={next ?? "/admin"} />

      <label className="admin-field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
          disabled={pending}
        />
      </label>

      <button type="submit" className="admin-btn" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
