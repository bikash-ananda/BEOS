"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/session-boundary";
import { Button } from "@/components/ui";
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
  const summaryFailed = [users, branches, roles].some((query) => query.isError);
  function retrySummary() {
    if (canManageUsers) void users.refetch();
    void branches.refetch();
    void roles.refetch();
  }

  return (
    <main className="workspace-page">
      <section className="page-heading">
        <div>
          <h1>Good to see you, {firstName}.</h1>
          <p>
            Your access and organization data are live. Business modules will
            arrive through the next implementation phases.
          </p>
        </div>
      </section>
      <section
        className="scope-register"
        aria-labelledby="scope-heading"
        aria-busy={branches.isPending || roles.isPending || users.isPending}
      >
        <header>
          <h2 id="scope-heading">Workspace scope</h2>
          <Button
            variant="quiet"
            onClick={retrySummary}
            disabled={
              branches.isFetching || roles.isFetching || users.isFetching
            }
          >
            <RefreshCw />
            Refresh
          </Button>
        </header>
        {summaryFailed && (
          <div className="inline-error" role="alert">
            <AlertTriangle />
            <span>Some workspace totals are unavailable.</span>
            <Button variant="quiet" onClick={retrySummary}>
              Try again
            </Button>
          </div>
        )}
        <dl>
          <div>
            <dt>
              <Users />
              People records
            </dt>
            <dd>
              {canManageUsers
                ? users.isPending
                  ? "Loading"
                  : users.isError
                    ? "Unavailable"
                    : (users.data?.total ?? 0)
                : "Scoped"}
            </dd>
            <small>
              {canManageUsers
                ? "Managed company accounts"
                : "Based on your access"}
            </small>
          </div>
          <div>
            <dt>
              <Building2 />
              Active branches
            </dt>
            <dd>
              {branches.isPending
                ? "Loading"
                : branches.isError
                  ? "Unavailable"
                  : (branches.data?.filter((item) => item.isActive).length ??
                    0)}
            </dd>
            <small>Your location: {user.branch?.code ?? "All branches"}</small>
          </div>
          <div>
            <dt>
              <ShieldCheck />
              Defined roles
            </dt>
            <dd>
              {roles.isPending
                ? "Loading"
                : roles.isError
                  ? "Unavailable"
                  : (roles.data?.length ?? 0)}
            </dd>
            <small>{user.roles.join(", ")}</small>
          </div>
        </dl>
      </section>
      <section className="workspace-grid">
        <article className="paper-card identity-card">
          <h2>Your access record</h2>
          <h3>{user.fullName}</h3>
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
          <h2>Your workspace is ready.</h2>
          <p>
            Company tools will appear here as they are enabled for your role.
            Your current access and organization assignment are shown alongside.
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
