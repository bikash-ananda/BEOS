"use client";

import {
  Building2,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useSession } from "../session-boundary";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const user = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const canAdmin = user.permissions.some((permission) =>
    permission.endsWith(".manage"),
  );
  const initials = user.fullName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function logout() {
    await apiFetch<void>("/auth/logout", { method: "POST" });
    client.clear();
    router.replace("/login");
  }

  return (
    <div className="workspace-shell">
      {open && (
        <button
          className="nav-scrim"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`side-rail ${open ? "side-rail-open" : ""}`}>
        <div className="brand-lockup side-brand">
          <span className="brand-mark">BE</span>
          <span>
            <strong>BEOS</strong>
            <small>Bikash Engineering</small>
          </span>
        </div>
        <button
          className="mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <nav aria-label="Primary navigation">
          <p className="rail-label">Workspace</p>
          <Link
            className={pathname === "/" ? "active" : ""}
            href="/"
            onClick={() => setOpen(false)}
          >
            <LayoutGrid />
            Overview
          </Link>
          {canAdmin && (
            <Link
              className={pathname.startsWith("/admin") ? "active" : ""}
              href="/admin"
              onClick={() => setOpen(false)}
            >
              <ShieldCheck />
              Administration
            </Link>
          )}
        </nav>
        <div className="rail-context">
          <Building2 />
          <span>
            <small>Assigned location</small>
            <strong>{user.branch?.name ?? "Company-wide"}</strong>
            <em>{user.department?.name ?? "No department"}</em>
          </span>
        </div>
        <div className="rail-user">
          <span className="avatar">{initials}</span>
          <span>
            <strong>{user.fullName}</strong>
            <small>{user.roles.join(" · ")}</small>
          </span>
        </div>
        <button className="rail-logout" onClick={logout}>
          <LogOut />
          Sign out
        </button>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <button
            className="mobile-menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <span className="header-coordinate">
            BE / OPS / {pathname.startsWith("/admin") ? "ADMIN" : "HOME"}
          </span>
          <span className="system-live">
            <i />
            System online
          </span>
        </header>
        {children}
      </div>
    </div>
  );
}
