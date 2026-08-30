"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
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
    if (session.isError) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, session.isError]);

  if (session.isPending || session.isError) {
    return (
      <main className="loading-screen" aria-live="polite">
        <div className="loading-mark">BE</div>
        <p>Opening your workspace…</p>
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
