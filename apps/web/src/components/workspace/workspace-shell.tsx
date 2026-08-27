"use client";

import {
  Bell,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  MessagesSquare,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { NotificationDrawer } from "../notifications/notification-drawer";
import { useSession } from "../session-boundary";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const user = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const firstNavigationLink = useRef<HTMLAnchorElement>(null);
  const notificationButton = useRef<HTMLButtonElement>(null);
  const canReadFiles = user.permissions.includes("files.read");
  const canReadCommunication = user.permissions.includes("communication.read");
  const canReadWork = user.permissions.includes("meetings.read") && user.permissions.includes("tasks.read");
  const canAdmin = user.permissions.some(
    (permission) =>
      permission.endsWith(".manage") || permission === "audit.read",
  );
  const unread = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiFetch<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 60_000,
  });
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
          {canReadFiles && (
            <Link
              className={pathname.startsWith("/files") ? "active" : ""}
              href="/files"
              onClick={() => setOpen(false)}
            >
              <FileText />
              Files
            </Link>
          )}
          {canReadCommunication && (
            <Link
              className={pathname.startsWith("/communication") ? "active" : ""}
              href="/communication"
              onClick={() => setOpen(false)}
            >
              <MessagesSquare />
              Communication
            </Link>
          )}
          {canReadWork && (
            <Link
              className={pathname.startsWith("/work") ? "active" : ""}
              href="/work"
              onClick={() => setOpen(false)}
            >
              <BriefcaseBusiness />
              Meetings &amp; Tasks
            </Link>
          )}
          <Link
            className={pathname.startsWith("/notifications") ? "active" : ""}
            href="/notifications"
            onClick={() => setOpen(false)}
          >
            <Bell />
            Notifications
            {!!unread.data?.count && (
              <span className="rail-count">{unread.data.count}</span>
            )}
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
            BE / OPS / {workspaceCoordinate(pathname)}
          </span>
          <button
            ref={notificationButton}
            type="button"
            className="notification-trigger"
            onClick={() => setNotificationsOpen((value) => !value)}
            aria-label={`Notifications${unread.data?.count ? `, ${unread.data.count} unread` : ""}`}
            aria-expanded={notificationsOpen}
            aria-controls="notification-drawer"
          >
            <Bell />
            {!!unread.data?.count && <span>{unread.data.count}</span>}
          </button>
          <span className="system-live">
            {user.branch?.code ?? "Company-wide"}
          </span>
        </header>
        <div id="main-content" className="workspace-content" tabIndex={-1}>
          {children}
        </div>
      </div>
      <NotificationDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        triggerRef={notificationButton}
      />
    </div>
  );
}

function workspaceCoordinate(pathname: string) {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/files")) return "FILES";
  if (pathname.startsWith("/notifications")) return "NOTIFICATIONS";
  if (pathname.startsWith("/communication")) return "COMMUNICATION";
  if (pathname.startsWith("/work")) return "WORK";
  return "HOME";
}
