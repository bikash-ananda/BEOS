"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useCallback, useDeferredValue, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ManagedUser, Page } from "@/lib/types";
import { Button, EmptyState, QueryGate, Status } from "../ui";
import { UserEditor } from "./user-editor";

export function UsersPanel() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const users = useQuery({
    queryKey: ["users", deferredSearch, page],
    queryFn: () =>
      apiFetch<Page<ManagedUser>>(
        `/identity/users?limit=25&page=${page}&search=${encodeURIComponent(deferredSearch)}`,
      ),
  });
  const pageCount = Math.max(1, Math.ceil((users.data?.total ?? 0) / 25));
  const closeEditor = useCallback(() => {
    const triggerId = editing ? `manage-user-${editing.id}` : null;
    setEditing(null);
    if (triggerId) {
      requestAnimationFrame(() => document.getElementById(triggerId)?.focus());
    }
  }, [editing]);

  return (
    <div className="users-layout">
      <section>
        <div className="panel-heading">
          <div>
            <h2>People</h2>
          </div>
          <span>{users.data?.total ?? 0} accounts</span>
        </div>
        <label className="search-field">
          <Search />
          <input
            placeholder="Search name or email"
            aria-label="Search people"
            maxLength={120}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <QueryGate queries={[users]} label="People">
          <div className="record-list users">
            {users.data?.items.length ? (
              users.data.items.map((user) => (
                <article key={user.id}>
                  <span className="avatar">
                    {user.fullName
                      .split(/\s+/)
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
                  <Button
                    id={`manage-user-${user.id}`}
                    variant="quiet"
                    aria-expanded={editing?.id === user.id}
                    aria-controls="user-editor"
                    onClick={() => setEditing(user)}
                  >
                    Manage
                  </Button>
                </article>
              ))
            ) : (
              <EmptyState title="No people found">
                {deferredSearch
                  ? "Try a different name or email."
                  : "Create an invitation to add the first company account."}
              </EmptyState>
            )}
          </div>
          {users.data && users.data.total > 25 && (
            <nav className="pagination" aria-label="People pages">
              <Button
                variant="secondary"
                disabled={page === 1 || users.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {pageCount}
              </span>
              <Button
                variant="secondary"
                disabled={page === pageCount || users.isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </QueryGate>
      </section>
      {editing && (
        <UserEditor key={editing.id} user={editing} onClose={closeEditor} />
      )}
    </div>
  );
}
