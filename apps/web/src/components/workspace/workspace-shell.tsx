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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useSession } from "../session-boundary";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const user = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const firstNavigationLink = useRef<HTMLAnchorElement>(null);
  const canAdmin = user.permissions.some((permission) =>
    permission.endsWith(".manage"),
  );
  const initials = user.fullName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    firstNavigationLink.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  async function logout() {
    await apiFetch<void>("/auth/logout", { method: "POST" });
    client.clear();
    router.replace("/login");
  }

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      {open && (
        <button
          type="button"
          className="nav-scrim"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        id="workspace-navigation"
        className={`side-rail ${open ? "side-rail-open" : ""}`}
      >
        <div className="brand-lockup side-brand">
          <span className="brand-mark">BE</span>
          <span>
            <strong>BEOS</strong>
            <small>Bikash Engineering</small>
          </span>
        </div>
        <button
          type="button"
          className="mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <nav aria-label="Primary navigation">
          <p className="rail-label">Workspace</p>
          <Link
            ref={firstNavigationLink}
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
        <button type="button" className="rail-logout" onClick={logout}>
          <LogOut />
          Sign out
        </button>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <button
            type="button"
            className="mobile-menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="workspace-navigation"
          >
            <Menu />
          </button>
          <span className="header-coordinate">
            BE / OPS / {pathname.startsWith("/admin") ? "ADMIN" : "HOME"}
          </span>
          <span className="system-live">
            {user.branch?.code ?? "Company-wide"}
          </span>
        </header>
        <div id="main-content" className="workspace-content" tabIndex={-1}>
          {children}
        </div>
      </div>
    </div>
  );
}
