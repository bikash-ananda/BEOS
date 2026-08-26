"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type { Branch, Department } from "@/lib/types";
import { Button, EmptyState, Field, QueryGate, Status } from "../ui";

export function OrganizationPanel() {
  const client = useQueryClient();
  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiFetch<Branch[]>("/identity/branches"),
  });
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiFetch<Department[]>("/identity/departments"),
  });
  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    city: "",
  });
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    branchId: "",
  });

  const refresh = () =>
    client
      .invalidateQueries({ queryKey: ["branches"] })
      .then(() => client.invalidateQueries({ queryKey: ["departments"] }));
  const mutate = useMutation({
    mutationFn: ({
      path,
      method,
      body,
    }: {
      path: string;
      method: "POST" | "PATCH";
      body: unknown;
    }) => apiFetch(path, { method, ...jsonBody(body) }),
    onSuccess: async () => {
      await refresh();
      toast.success("Organization updated");
    },
    onError: (error) => toast.error(error.message),
  });

  function addBranch(event: FormEvent) {
    event.preventDefault();
    mutate.mutate(
      { path: "/identity/branches", method: "POST", body: branchForm },
      { onSuccess: () => setBranchForm({ name: "", code: "", city: "" }) },
    );
  }
  function addDepartment(event: FormEvent) {
    event.preventDefault();
    mutate.mutate(
      { path: "/identity/departments", method: "POST", body: departmentForm },
      {
        onSuccess: () =>
          setDepartmentForm({ name: "", code: "", branchId: "" }),
      },
    );
  }

  return (
    <div className="split-panels">
      <section>
        <div className="panel-heading">
          <div>
            <h2>Branches</h2>
          </div>
          <span>{branches.data?.length ?? 0} total</span>
        </div>
        <QueryGate queries={[branches]} label="Branches">
          <form className="compact-form" onSubmit={addBranch}>
            <Field
              required
              label="Branch name"
              maxLength={120}
              value={branchForm.name}
              onChange={(event) =>
                setBranchForm({ ...branchForm, name: event.target.value })
              }
            />
            <Field
              required
              label="Code"
              maxLength={20}
              value={branchForm.code}
              onChange={(event) =>
                setBranchForm({ ...branchForm, code: event.target.value })
              }
            />
            <Field
              label="City"
              maxLength={120}
              value={branchForm.city}
              onChange={(event) =>
                setBranchForm({ ...branchForm, city: event.target.value })
              }
            />
            <Button disabled={mutate.isPending}>
              {mutate.isPending ? "Saving…" : "Add branch"}
            </Button>
          </form>
          <div className="record-list">
            {branches.data?.length ? (
              branches.data.map((branch) => (
                <article key={branch.id}>
                  <div>
                    <strong>{branch.name}</strong>
                    <small>
                      {branch.code} · {branch.city ?? "City not set"} ·{" "}
                      {branch._count.users} people
                    </small>
                  </div>
                  <Status active={branch.isActive}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </Status>
                  <Button
                    variant="quiet"
                    disabled={mutate.isPending}
                    onClick={() =>
                      mutate.mutate({
                        path: `/identity/branches/${branch.id}`,
                        method: "PATCH",
                        body: { isActive: !branch.isActive },
                      })
                    }
                  >
                    {branch.isActive ? "Disable" : "Enable"}
                  </Button>
                </article>
              ))
            ) : (
              <EmptyState title="No branches">
                Add the first company location above.
              </EmptyState>
            )}
          </div>
        </QueryGate>
      </section>
      <section>
        <div className="panel-heading">
          <div>
            <h2>Departments</h2>
          </div>
          <span>{departments.data?.length ?? 0} total</span>
        </div>
        <QueryGate queries={[branches, departments]} label="Departments">
          <form className="compact-form" onSubmit={addDepartment}>
            <Field
              required
              label="Department name"
              maxLength={120}
              value={departmentForm.name}
              onChange={(event) =>
                setDepartmentForm({
                  ...departmentForm,
                  name: event.target.value,
                })
              }
            />
            <Field
              required
              label="Code"
              maxLength={20}
              value={departmentForm.code}
              onChange={(event) =>
                setDepartmentForm({
                  ...departmentForm,
                  code: event.target.value,
                })
              }
            />
            <label className="field">
              <span>Branch</span>
              <select
                required
                value={departmentForm.branchId}
                onChange={(event) =>
                  setDepartmentForm({
                    ...departmentForm,
                    branchId: event.target.value,
                  })
                }
              >
                <option value="">Select branch</option>
                {branches.data
                  ?.filter((branch) => branch.isActive)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </label>
            <Button disabled={mutate.isPending}>
              {mutate.isPending ? "Saving…" : "Add department"}
            </Button>
          </form>
          <div className="record-list">
            {departments.data?.length ? (
              departments.data.map((department) => (
                <article key={department.id}>
                  <div>
                    <strong>{department.name}</strong>
                    <small>
                      {department.code} · {department.branch.name} ·{" "}
                      {department._count.users} people
                    </small>
                  </div>
                  <Status active={department.isActive}>
                    {department.isActive ? "Active" : "Inactive"}
                  </Status>
                  <Button
                    variant="quiet"
                    disabled={mutate.isPending}
                    onClick={() =>
                      mutate.mutate({
                        path: `/identity/departments/${department.id}`,
                        method: "PATCH",
                        body: { isActive: !department.isActive },
                      })
                    }
                  >
                    {department.isActive ? "Disable" : "Enable"}
                  </Button>
                </article>
              ))
            ) : (
              <EmptyState title="No departments">
                Departments stay tied to a branch.
              </EmptyState>
            )}
          </div>
        </QueryGate>
      </section>
    </div>
  );
}
