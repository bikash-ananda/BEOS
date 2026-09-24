import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TokenPasswordForm } from "@/components/auth/token-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password."
      intro="Use the secure token supplied by your administrator. Existing sessions will be closed."
    >
      <Suspense fallback={<p>Preparing recovery…</p>}>
        <TokenPasswordForm mode="reset" />
      </Suspense>
    </AuthShell>
  );
}
