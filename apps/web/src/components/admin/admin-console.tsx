"use client";

import {
  Building2,
  KeyRound,
  MailPlus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "../session-boundary";
import { InvitationsPanel } from "./invitations-panel";
import { OrganizationPanel } from "./organization-panel";
import { RolesPanel } from "./roles-panel";
import { UsersPanel } from "./users-panel";

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
      <section className="paper-card">
        <h2>Administration access required</h2>
        <p>Your role does not include company administration permissions.</p>
      </section>
    );
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof Users }> = [
    { key: "users", label: "People", icon: Users },
    { key: "invitations", label: "Invitations", icon: MailPlus },
    { key: "roles", label: "Roles", icon: ShieldCheck },
    { key: "organization", label: "Organization", icon: Building2 },
  ];

  return (
    <>
      <div
        className="admin-tabs"
        role="tablist"
        aria-label="Administration sections"
      >
        {tabs
          .filter(({ key }) => allowed[key])
          .map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
            >
              <Icon />
              {label}
            </button>
          ))}
      </div>
      <div className="admin-panel" role="tabpanel">
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
