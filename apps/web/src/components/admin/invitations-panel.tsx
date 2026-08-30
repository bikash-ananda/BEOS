"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type { Branch, Department, Invitation, Role } from "@/lib/types";
import { Button, EmptyState, Field, Status } from "../ui";

export function InvitationsPanel() {
  const client = useQueryClient();
  const invitations = useQuery({
    queryKey: ["invitations"],
    queryFn: () => apiFetch<Invitation[]>("/identity/invitations"),
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
      await navigator.clipboard.writeText(
        `${location.origin}/accept-invite?token=${encodeURIComponent(token)}`,
      );
      await client.invalidateQueries({ queryKey: ["invitations"] });
      setForm({ email: "", roleIds: [], branchId: "", departmentId: "" });
      toast.success("Invitation link copied");
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
        <p className="eyebrow">Controlled onboarding</p>
        <h2>Invite a team member</h2>
        <p>
          BEOS creates a single-use link. It is copied to your clipboard so you
          can deliver it through your approved channel.
        </p>
        <form className="stack-form" onSubmit={submit}>
          <Field
            required
            type="email"
            label="Work email"
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
        </form>
      </section>
      <section>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Access queue</p>
            <h2>Invitations</h2>
          </div>
          <span>{invitations.data?.length ?? 0} records</span>
        </div>
        <div className="record-list invitations">
          {invitations.data?.length ? (
            invitations.data.map((invitation) => (
              <article key={invitation.id}>
                <div>
                  <strong>{invitation.email}</strong>
                  <small>
                    {invitation.roles.map(({ name }) => name).join(", ")} ·{" "}
                    {invitation.branch?.name ?? "Company-wide"}
                  </small>
                  <small>
                    Expires{" "}
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </small>
                </div>
                <Status active={invitation.status === "pending"}>
                  {invitation.status}
                </Status>
                {invitation.status === "pending" && (
                  <Button
                    variant="quiet"
                    onClick={() => revoke.mutate(invitation.id)}
                  >
                    Revoke
                  </Button>
                )}
              </article>
            ))
          ) : (
            <EmptyState title="No invitations">
              New invitations will appear here.
            </EmptyState>
          )}
        </div>
      </section>
    </div>
  );
}
