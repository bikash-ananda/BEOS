"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ManagedUser, Page } from "@/lib/types";
import { Button, EmptyState, Status } from "../ui";
import { UserEditor } from "./user-editor";

export function UsersPanel() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const users = useQuery({
    queryKey: ["users", search],
    queryFn: () =>
      apiFetch<Page<ManagedUser>>(
        `/identity/users?limit=100&search=${encodeURIComponent(search)}`,
      ),
  });

  return (
    <div className="users-layout">
      <section>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Company directory</p>
            <h2>People</h2>
          </div>
          <span>{users.data?.total ?? 0} accounts</span>
        </div>
        <label className="search-field">
          <Search />
          <input
            placeholder="Search name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="record-list users">
          {users.data?.items.length ? (
            users.data.items.map((user) => (
              <article key={user.id}>
                <span className="avatar">
                  {user.fullName
                    .split(/\\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <strong>{user.fullName}</strong>
                  <small>{user.email}</small>
                  <small>
                    {user.roles.map(({ name }) => name).join(", ")} ·{" "}
                    {user.branch?.name ?? "Company-wide"}
                  </small>
                </div>
                <Status active={user.isActive}>
                  {user.isActive ? "Active" : "Disabled"}
                </Status>
                <Button variant="quiet" onClick={() => setEditing(user)}>
                  Manage
                </Button>
              </article>
            ))
          ) : (
            <EmptyState title="No people found">
              Try a different search or create an invitation.
            </EmptyState>
          )}
        </div>
      </section>
      {editing && (
        <UserEditor
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
