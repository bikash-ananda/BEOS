"use client";

import { ArrowUpRight, Building2, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/session-boundary";
import { apiFetch } from "@/lib/api";
import type { Branch, ManagedUser, Page, Role } from "@/lib/types";

export default function WorkspaceHome() {
  const user = useSession();
  const canManageUsers = user.permissions.includes("users.manage");
  const users = useQuery({
    queryKey: ["users", "summary"],
    queryFn: () => apiFetch<Page<ManagedUser>>("/identity/users?limit=1"),
    enabled: canManageUsers,
  });
  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiFetch<Branch[]>("/identity/branches"),
  });
  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiFetch<Role[]>("/identity/roles"),
  });
  const firstName = user.fullName.split(" ")[0];

  return (
    <main className="workspace-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Company operating system</p>
          <h1>Good to see you, {firstName}.</h1>
          <p>
            Your access and organization data are live. Business modules will
            arrive through the next implementation phases.
          </p>
        </div>
        <span className="heading-index">
          02
          <br />
          <small>IDENTITY</small>
        </span>
      </section>
      <section className="metric-grid" aria-label="Workspace summary">
        <article>
          <span>
            <Users />
          </span>
          <strong>
            {canManageUsers ? (users.data?.total ?? "—") : "Scoped"}
          </strong>
          <p>People records</p>
          <small>
            {canManageUsers
              ? "Managed company accounts"
              : "Based on your access"}
          </small>
        </article>
        <article>
          <span>
            <Building2 />
          </span>
          <strong>
            {branches.data?.filter((item) => item.isActive).length ?? "—"}
          </strong>
          <p>Active branches</p>
          <small>Your location: {user.branch?.code ?? "ALL"}</small>
        </article>
        <article>
          <span>
            <ShieldCheck />
          </span>
          <strong>{roles.data?.length ?? "—"}</strong>
          <p>Defined roles</p>
          <small>{user.roles.join(", ")}</small>
        </article>
      </section>
      <section className="workspace-grid">
        <article className="paper-card identity-card">
          <span className="card-index">YOUR RECORD</span>
          <h2>{user.fullName}</h2>
          <p>{user.email}</p>
          <dl>
            <div>
              <dt>Branch</dt>
              <dd>{user.branch?.name ?? "Company-wide"}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{user.department?.name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt>Access roles</dt>
              <dd>{user.roles.join(", ")}</dd>
            </div>
          </dl>
        </article>
        <article className="paper-card next-card">
          <span className="card-index">CURRENT BUILD</span>
          <h2>Identity foundation complete.</h2>
          <p>
            BEOS now has real sessions, permissions, company structure, and
            administrator-managed access—without demo business records.
          </p>
          {canManageUsers && (
            <Link href="/admin">
              Open administration <ArrowUpRight />
            </Link>
          )}
        </article>
      </section>
    </main>
  );
}
