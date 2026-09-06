import type { Metadata } from "next";
import { adminAuthStatus } from "@/lib/server/admin-auth";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const auth = adminAuthStatus();

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Corn Fodder admin</h1>
        <p className="hint">Quote requests and product content.</p>

        {!auth.configured ? (
          /*
           * No password is configured, so there is nothing to sign in
           * with. Saying so — and how to fix it — is more useful than a
           * form that can only ever reject you. The reason text names
           * an environment variable, never a value.
           */
          <div className="notice notice-error">
            <p>
              <strong>Not configured.</strong> {auth.reason}.
            </p>
            <p>
              Run <code>npm run admin:password</code> and add both values to the deployment
              environment, then reload.
            </p>
          </div>
        ) : (
          <LoginForm next={next} />
        )}

        {auth.configured && !isSupabaseConfigured() && (
          <div className="notice notice-warn" style={{ marginTop: 16, marginBottom: 0 }}>
            <p>
              <strong>No database connected.</strong> You can sign in, but there is nothing to
              read: quote requests are not being stored.
            </p>
            <p>
              Set <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code>, after
              running <code>docs/sql/001-init.sql</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
