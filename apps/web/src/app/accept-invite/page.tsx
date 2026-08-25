import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TokenPasswordForm } from "@/components/auth/token-password-form";

export default function AcceptInvitePage() {
  return (
    <AuthShell
      eyebrow="Company invitation"
      title="Set up your workspace."
      intro="Confirm your identity and choose a strong password to activate your account."
    >
      <Suspense fallback={<p>Preparing invitation…</p>}>
        <TokenPasswordForm mode="invite" />
      </Suspense>
    </AuthShell>
  );
}
