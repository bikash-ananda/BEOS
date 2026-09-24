"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import type { Branch, Department, ManagedUser, Role } from "@/lib/types";
import { Button, Field, QueryGate } from "../ui";

export function UserEditor({
  user,
  onClose,
}: {
  user: ManagedUser;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
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
  useEffect(() => {
    headingRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
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
      const link = `${location.origin}/reset-password?token=${encodeURIComponent(token)}`;
      setResetLink(link);
      const copied = await copyText(link);
      if (copied) toast.success("Password reset link copied");
      else toast.warning("Reset link created. Copy the link shown below.");
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
    <aside
      id="user-editor"
      className="edit-drawer"
      aria-label={`Manage ${user.fullName}`}
    >
      <h2 ref={headingRef} tabIndex={-1}>
        Manage {user.fullName}
      </h2>
      <QueryGate
        queries={[roles, branches, departments]}
        label="Account options"
      >
        <form className="stack-form" onSubmit={submit}>
          <Field
            required
            label="Full name"
            maxLength={120}
            value={form.fullName}
            onChange={(event) =>
              setForm({ ...form, fullName: event.target.value })
            }
          />
          <Field
            required
            type="email"
            label="Email"
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
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <Button
            type="button"
            variant="quiet"
            disabled={reset.isPending}
            onClick={() => reset.mutate()}
          >
            {reset.isPending
              ? "Creating reset link…"
              : "Create password reset link"}
          </Button>
          {resetLink && (
            <div className="generated-link" role="status">
              <label htmlFor="latest-reset-link">
                Latest password reset link
              </label>
              <input
                id="latest-reset-link"
                readOnly
                value={resetLink}
                onFocus={(event) => event.target.select()}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  const copied = await copyText(resetLink);
                  if (copied) toast.success("Reset link copied");
                  else toast.error("Select and copy the link manually");
                }}
              >
                Copy again
              </Button>
            </div>
          )}
        </form>
      </QueryGate>
    </aside>
  );
}
