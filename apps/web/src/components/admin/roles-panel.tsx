"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";
import { Button, EmptyState, Field } from "../ui";

export function RolesPanel() {
  const client = useQueryClient();
  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiFetch<Role[]>("/identity/roles"),
  });
  const permissions = useQuery({
    queryKey: ["permissions"],
    queryFn: () => apiFetch<Permission[]>("/identity/permissions"),
  });
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[],
  });
  useEffect(() => {
    if (editing)
      setForm({
        name: editing.name,
        description: editing.description ?? "",
        permissionIds: editing.permissions.map(({ id }) => id),
      });
  }, [editing]);
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(editing ? `/identity/roles/${editing.id}` : "/identity/roles", {
        method: editing ? "PATCH" : "POST",
        ...jsonBody(form),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["roles"] });
      setEditing(null);
      setForm({ name: "", description: "", permissionIds: [] });
      toast.success("Role saved");
    },
    onError: (error) => toast.error(error.message),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }
  function toggle(id: string) {
    setForm((value) => ({
      ...value,
      permissionIds: value.permissionIds.includes(id)
        ? value.permissionIds.filter((item) => item !== id)
        : [...value.permissionIds, id],
    }));
  }

  return (
    <div className="management-layout">
      <section className="management-form">
        <p className="eyebrow">Permission bundle</p>
        <h2>{editing ? `Edit ${editing.name}` : "Create a custom role"}</h2>
        <p>
          System roles remain source-managed. Custom roles can be adapted to
          company operations.
        </p>
        <form className="stack-form" onSubmit={submit}>
          <Field
            required
            label="Role name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Field
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
          <fieldset className="check-grid">
            <legend>Permissions</legend>
            {permissions.data?.map((permission) => (
              <label key={permission.id}>
                <input
                  type="checkbox"
                  checked={form.permissionIds.includes(permission.id)}
                  onChange={() => toggle(permission.id)}
                />
                <span>
                  <strong>{permission.key}</strong>
                  <small>{permission.description}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="form-actions">
            <Button disabled={mutation.isPending || !form.permissionIds.length}>
              {editing ? "Save changes" : "Create role"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setForm({ name: "", description: "", permissionIds: [] });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </section>
      <section>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Access model</p>
            <h2>Roles</h2>
          </div>
          <span>{roles.data?.length ?? 0} defined</span>
        </div>
        <div className="role-grid">
          {roles.data?.length ? (
            roles.data.map((role) => (
              <article key={role.id}>
                <header>
                  <span>{role.isSystem ? "SYSTEM" : "CUSTOM"}</span>
                  <small>{role._count.users} users</small>
                </header>
                <h3>{role.name}</h3>
                <p>{role.description ?? "No description"}</p>
                <div className="tag-row">
                  {role.permissions.map((permission) => (
                    <em key={permission.id}>{permission.key}</em>
                  ))}
                </div>
                {!role.isSystem && (
                  <Button variant="quiet" onClick={() => setEditing(role)}>
                    Edit role
                  </Button>
                )}
              </article>
            ))
          ) : (
            <EmptyState title="No roles">
              Seed the RBAC catalog to begin.
            </EmptyState>
          )}
        </div>
      </section>
    </div>
  );
}
