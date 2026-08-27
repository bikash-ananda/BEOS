"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type {
  AuthUser,
  CommunicationPerson,
  Conversation,
  ConversationType,
  Department,
  Page,
} from "@/lib/types";
import { Button, QueryGate } from "../ui";

export function NewConversationForm({
  user,
  onCancel,
  onCreated,
}: {
  user: AuthUser;
  onCancel: () => void;
  onCreated: (conversation: Conversation) => Promise<void>;
}) {
  const canManage = user.permissions.includes("communication.manage");
  const [type, setType] = useState<ConversationType>("DIRECT");
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState(user.department?.id ?? "");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const people = useQuery({
    queryKey: ["communication", "people", "conversation-form"],
    queryFn: () => apiFetch<Page<CommunicationPerson>>("/communication/people?limit=100"),
  });
  const departments = useQuery({
    queryKey: ["organization", "departments"],
    queryFn: () => apiFetch<Department[]>("/identity/departments"),
    enabled: canManage && !user.branch,
  });
  const create = useMutation({
    mutationFn: () =>
      apiFetch<Conversation>("/communication/conversations", {
        method: "POST",
        ...jsonBody({
          type,
          ...(name.trim() && { name: name.trim() }),
          ...(type === "DEPARTMENT" && { departmentId }),
          ...(type === "DIRECT" || type === "PRIVATE_GROUP"
            ? { memberIds }
            : {}),
        }),
      }),
    onSuccess: onCreated,
    onError: (error: Error) => toast.error(error.message),
  });
  const choices = people.data?.items.filter((person) => person.id !== user.id) ?? [];
  const valid =
    type === "COMPANY"
      ? true
      : type === "DEPARTMENT"
        ? Boolean(departmentId)
        : type === "DIRECT"
          ? memberIds.length === 1
          : name.trim().length >= 2 && memberIds.length >= 1;

  function selectMember(id: string) {
    setMemberIds((current) =>
      type === "DIRECT"
        ? [id]
        : current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
    );
  }

  return (
    <form
      className="record-composer conversation-form"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        create.mutate();
      }}
    >
      <label>
        <span>Conversation type</span>
        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value as ConversationType);
            setMemberIds([]);
          }}
        >
          <option value="DIRECT">Direct</option>
          <option value="PRIVATE_GROUP">Private group</option>
          {user.department && <option value="DEPARTMENT">Department</option>}
          {canManage && !user.branch && (
            <>
              <option value="DEPARTMENT">Department</option>
              <option value="COMPANY">Company</option>
            </>
          )}
        </select>
      </label>
      {(type === "PRIVATE_GROUP" || type === "COMPANY") && (
        <label>
          <span>Name</span>
          <input
            value={name}
            maxLength={120}
            placeholder={type === "COMPANY" ? "Company" : "Group name"}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      )}
      {type === "DEPARTMENT" && (
        <label>
          <span>Department</span>
          {user.department ? (
            <input value={user.department.name} disabled />
          ) : (
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
            >
              <option value="">Choose a department</option>
              {departments.data
                ?.filter((department) => department.isActive)
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} — {department.branch.name}
                  </option>
                ))}
            </select>
          )}
        </label>
      )}
      {(type === "DIRECT" || type === "PRIVATE_GROUP") && (
        <fieldset className="people-selector">
          <legend>{type === "DIRECT" ? "Choose one person" : "Choose members"}</legend>
          <QueryGate queries={[people]} label="People">
            {choices.map((person) => (
              <label key={person.id}>
                <input
                  type={type === "DIRECT" ? "radio" : "checkbox"}
                  name="conversation-member"
                  checked={memberIds.includes(person.id)}
                  onChange={() => selectMember(person.id)}
                />
                <span>
                  <strong>{person.fullName}</strong>
                  <small>{person.department?.name ?? person.branch?.name ?? "Company-wide"}</small>
                </span>
              </label>
            ))}
          </QueryGate>
        </fieldset>
      )}
      <div className="record-actions">
        <Button disabled={!valid || create.isPending}>
          {create.isPending ? "Creating…" : "Create conversation"}
        </Button>
        <Button type="button" variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
