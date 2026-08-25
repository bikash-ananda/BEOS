"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type { Branch, Department, ManagedUser, Role } from "@/lib/types";
import { Button, Field } from "../ui";

export function UserEditor({
  user,
  onClose,
}: {
  user: ManagedUser;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    branchId: user.branch?.id ?? "",
    departmentId: user.department?.id ?? "",
    roleIds: user.roles.map(({ id }) => id),
    isActive: user.isActive,
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
  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/identity/users/${user.id}`, {
        method: "PATCH",
        ...jsonBody({
          ...form,
          branchId: form.branchId || null,
          departmentId: form.departmentId || null,
        }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });
  const reset = useMutation({
    mutationFn: () =>
      apiFetch<{ token: string }>("/identity/password-resets", {
        method: "POST",
        ...jsonBody({ email: user.email }),
      }),
    onSuccess: async ({ token }) => {
      await navigator.clipboard.writeText(
        `${location.origin}/reset-password?token=${encodeURIComponent(token)}`,
      );
      toast.success("Password reset link copied");
    },
    onError: (error) => toast.error(error.message),
  });
  function toggleRole(id: string) {
    setForm((value) => ({
      ...value,
      roleIds: value.roleIds.includes(id)
        ? value.roleIds.filter((item) => item !== id)
        : [...value.roleIds, id],
    }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <aside className="edit-drawer">
      <p className="eyebrow">Account controls</p>
      <h2>Manage person</h2>
      <form className="stack-form" onSubmit={submit}>
        <Field
          required
          label="Full name"
          value={form.fullName}
          onChange={(event) =>
            setForm({ ...form, fullName: event.target.value })
          }
        />
        <Field
          required
          type="email"
          label="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
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
            value={form.departmentId}
            disabled={!form.branchId}
            onChange={(event) =>
              setForm({ ...form, departmentId: event.target.value })
            }
          >
            <option value="">No department</option>
            {departments.data
              ?.filter(
                (department) =>
                  department.isActive && department.branchId === form.branchId,
              )
              .map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
          </select>
        </label>
        <fieldset className="check-grid">
          <legend>Roles</legend>
          {roles.data?.map((role) => (
            <label key={role.id}>
              <input
                type="checkbox"
                checked={form.roleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
              <span>
                <strong>{role.name}</strong>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              setForm({ ...form, isActive: event.target.checked })
            }
          />
          <span>Account is active</span>
        </label>
        <div className="form-actions">
          <Button disabled={save.isPending || !form.roleIds.length}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
        <Button type="button" variant="quiet" onClick={() => reset.mutate()}>
          Copy password reset link
        </Button>
      </form>
    </aside>
  );
}
