"use client";

import {
  Building2,
  KeyRound,
  MailPlus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { useSession } from "../session-boundary";
import { InvitationsPanel } from "./invitations-panel";
import { OrganizationPanel } from "./organization-panel";
import { RolesPanel } from "./roles-panel";
import { UsersPanel } from "./users-panel";
import { PermissionState } from "../ui";

type Tab = "users" | "invitations" | "roles" | "organization";

export function AdminConsole() {
  const user = useSession();
  const allowed = {
    users: user.permissions.includes("users.manage"),
    invitations: user.permissions.includes("invitations.manage"),
    roles: user.permissions.includes("roles.manage"),
    organization:
      user.permissions.includes("branches.manage") ||
      user.permissions.includes("departments.manage"),
  };
  const first = (Object.keys(allowed) as Tab[]).find((key) => allowed[key]);
  const [tab, setTab] = useState<Tab>(first ?? "users");

  if (!first) {
    return (
      <PermissionState>
        Your role does not include company administration permissions. Ask a
        Super Admin if your responsibilities have changed.
      </PermissionState>
    );
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof Users }> = [
    { key: "users", label: "People", icon: Users },
    { key: "invitations", label: "Invitations", icon: MailPlus },
    { key: "roles", label: "Roles", icon: ShieldCheck },
    { key: "organization", label: "Organization", icon: Building2 },
  ];
  const visibleTabs = tabs.filter(({ key }) => allowed[key]);
  function navigateTabs(
    event: KeyboardEvent<HTMLButtonElement>,
    current: number,
  ) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? visibleTabs.length - 1
          : (current +
              (event.key === "ArrowRight" ? 1 : -1) +
              visibleTabs.length) %
            visibleTabs.length;
    setTab(visibleTabs[next].key);
    document.getElementById(`admin-tab-${visibleTabs[next].key}`)?.focus();
  }

  return (
    <>
      <div
        className="admin-tabs"
        role="tablist"
        aria-label="Administration sections"
      >
        {visibleTabs.map(({ key, label, icon: Icon }, index) => (
          <button
            key={key}
            id={`admin-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            aria-controls="admin-tabpanel"
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => navigateTabs(event, index)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
      <div
        id="admin-tabpanel"
        className="admin-panel"
        role="tabpanel"
        aria-labelledby={`admin-tab-${tab}`}
      >
        {tab === "users" && <UsersPanel />}
        {tab === "invitations" && <InvitationsPanel />}
        {tab === "roles" && <RolesPanel />}
        {tab === "organization" && <OrganizationPanel />}
      </div>
      <div className="security-note">
        <KeyRound />
        <span>
          <strong>Every change is audited.</strong> Administrative actions are
          recorded with the actor, target, time, and request context.
        </span>
      </div>
    </>
  );
}
