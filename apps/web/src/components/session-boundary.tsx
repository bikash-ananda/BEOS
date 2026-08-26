"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { Button } from "./ui";
import type { AuthUser } from "@/lib/types";

const SessionContext = createContext<AuthUser | null>(null);

export function SessionBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => apiFetch<{ user: AuthUser }>("/auth/me"),
    retry: false,
  });

  useEffect(() => {
    if (session.error instanceof ApiError && session.error.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, session.error]);

  if (session.isPending) {
    return (
      <main className="loading-screen" aria-live="polite">
        <div className="loading-mark">BE</div>
        <p>Opening your workspace…</p>
      </main>
    );
  }
  if (session.isError) {
    if (session.error instanceof ApiError && session.error.status === 401) {
      return (
        <main className="loading-screen" aria-live="polite">
          <div className="loading-mark">BE</div>
          <p>Returning to sign in…</p>
        </main>
      );
    }
    return (
      <main className="session-error" role="alert">
        <div>
          <h1>BEOS could not open your workspace.</h1>
          <p>
            {session.error.message || "Check your connection and try again."}
          </p>
          <Button onClick={() => void session.refetch()}>Try again</Button>
        </div>
      </main>
    );
  }
  return (
    <SessionContext.Provider value={session.data.user}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSession must be used within SessionBoundary");
  return user;
}
