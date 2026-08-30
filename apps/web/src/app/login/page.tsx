import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Identity gateway"
      title="Welcome back."
      intro="Sign in with your company account to continue."
    >
      <Suspense fallback={<p>Preparing sign in…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
