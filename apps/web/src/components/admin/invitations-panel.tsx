"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { FormEvent, useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import type { Branch, Department, Invitation, Page, Role } from "@/lib/types";
import { Button, EmptyState, Field, QueryGate, Status } from "../ui";

const dateFormatter = new Intl.DateTimeFormat("en-NP", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function InvitationsPanel() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const invitations = useQuery({
    queryKey: ["invitations", deferredSearch, page],
    queryFn: () =>
      apiFetch<Page<Invitation>>(
        `/identity/invitations?limit=25&page=${page}&search=${encodeURIComponent(deferredSearch)}`,
      ),
  });
  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiFetch<Role[]>("/identity/roles"),
  });
  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiFetch<Branch[]>("/identity/branches"),
  });
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiFetch<Department[]>("/identity/departments"),
  });
  const [form, setForm] = useState({
    email: "",
    roleIds: [] as string[],
    branchId: "",
    departmentId: "",
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const pageCount = Math.max(1, Math.ceil((invitations.data?.total ?? 0) / 25));
  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ token: string }>("/identity/invitations", {
        method: "POST",
        ...jsonBody({
          ...form,
          branchId: form.branchId || undefined,
          departmentId: form.departmentId || undefined,
        }),
      }),
    onSuccess: async ({ token }) => {
      const link = `${location.origin}/accept-invite?token=${encodeURIComponent(token)}`;
      setGeneratedLink(link);
      const copied = await copyText(link);
      await client.invalidateQueries({ queryKey: ["invitations"] });
      setForm({ email: "", roleIds: [], branchId: "", departmentId: "" });
      if (copied) toast.success("Invitation link copied");
      else
        toast.warning("Invitation created. Copy the link shown in the form.");
    },
    onError: (error) => toast.error(error.message),
  });
  const revoke = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/identity/invitations/${id}/revoke`, { method: "POST" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation revoked");
    },
    onError: (error) => toast.error(error.message),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }
  function toggleRole(id: string) {
    setForm((value) => ({
      ...value,
      roleIds: value.roleIds.includes(id)
        ? value.roleIds.filter((item) => item !== id)
        : [...value.roleIds, id],
    }));
  }

  return (
    <div className="management-layout">
      <section className="management-form">
        <h2>Invite a team member</h2>
        <p>
          BEOS creates a single-use link. It is copied to your clipboard so you
          can deliver it through your approved channel.
        </p>
        <QueryGate
          queries={[roles, branches, departments]}
          label="Invitation options"
        >
          <form className="stack-form" onSubmit={submit}>
            <Field
              required
              type="email"
              label="Work email"
              maxLength={254}
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
            <label className="field">
              <span>Branch</span>
              <select
                value={form.branchId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    branchId: event.target.value,
                    departmentId: "",
                  })
                }
              >
                <option value="">Company-wide</option>
                {branches.data
                  ?.filter((branch) => branch.isActive)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              <span>Department</span>
              <select
                disabled={!form.branchId}
                value={form.departmentId}
                onChange={(event) =>
                  setForm({ ...form, departmentId: event.target.value })
                }
              >
                <option value="">No department</option>
                {departments.data
                  ?.filter(
                    (department) =>
                      department.isActive &&
                      department.branchId === form.branchId,
                  )
                  .map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
              </select>
            </label>
            <fieldset className="check-grid">
              <legend>Assign roles</legend>
              {roles.data?.map((role) => (
                <label key={role.id}>
                  <input
                    type="checkbox"
                    checked={form.roleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span>
                    <strong>{role.name}</strong>
                    <small>{role.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <Button disabled={create.isPending || !form.roleIds.length}>
              {create.isPending ? "Creating…" : "Create and copy link"}
            </Button>
            {generatedLink && (
              <div className="generated-link" role="status">
                <label htmlFor="latest-invitation-link">
                  Latest invitation link
                </label>
                <input
                  id="latest-invitation-link"
                  readOnly
                  value={generatedLink}
                  onFocus={(event) => event.target.select()}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const copied = await copyText(generatedLink);
                    if (copied) toast.success("Invitation link copied");
                    else toast.error("Select and copy the link manually");
                  }}
                >
                  Copy again
                </Button>
              </div>
            )}
          </form>
        </QueryGate>
      </section>
      <section>
        <div className="panel-heading">
          <div>
            <h2>Invitations</h2>
          </div>
          <span>{invitations.data?.total ?? 0} records</span>
        </div>
        <label className="search-field">
          <Search />
          <input
            aria-label="Search invitations"
            placeholder="Search email"
            maxLength={120}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <QueryGate queries={[invitations]} label="Invitations">
          <div className="record-list invitations">
            {invitations.data?.items.length ? (
              invitations.data.items.map((invitation) => (
                <article key={invitation.id}>
                  <div>
                    <strong>{invitation.email}</strong>
                    <small>
                      {invitation.roles.map(({ name }) => name).join(", ")} ·{" "}
                      {invitation.branch?.name ?? "Company-wide"}
                    </small>
                    <small>
                      Expires{" "}
                      {dateFormatter.format(new Date(invitation.expiresAt))}
                    </small>
                  </div>
                  <Status active={invitation.status === "pending"}>
                    {invitation.status}
                  </Status>
                  {invitation.status === "pending" && (
                    <Button
                      variant="quiet"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(invitation.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </article>
              ))
            ) : (
              <EmptyState title="No invitations found">
                {deferredSearch
                  ? "Try a different email address."
                  : "New invitations will appear here."}
              </EmptyState>
            )}
          </div>
          {invitations.data && invitations.data.total > 25 && (
            <nav className="pagination" aria-label="Invitation pages">
              <Button
                variant="secondary"
                disabled={page === 1 || invitations.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {pageCount}
              </span>
              <Button
                variant="secondary"
                disabled={page === pageCount || invitations.isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </QueryGate>
      </section>
    </div>
  );
}
