import type { ReactNode } from "react";
import { SessionBoundary } from "@/components/session-boundary";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <SessionBoundary>
      <WorkspaceShell>{children}</WorkspaceShell>
    </SessionBoundary>
  );
}
