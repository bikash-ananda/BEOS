"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AuditEntry, Page } from "@/lib/types";
import { Button, EmptyState, QueryGate } from "../ui";

const dateFormatter = new Intl.DateTimeFormat("en-NP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AuditPanel() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const entries = useQuery({
    queryKey: ["audit", deferredSearch, page],
    queryFn: () => {
      const query = new URLSearchParams({ page: String(page), limit: "25" });
      if (deferredSearch) query.set("search", deferredSearch);
      return apiFetch<Page<AuditEntry>>(`/audit?${query}`);
    },
  });
  const pageCount = Math.max(1, Math.ceil((entries.data?.total ?? 0) / 25));

  return (
    <section className="management-section audit-section">
      <header className="section-heading">
        <div>
          <h2>Audit history</h2>
          <p>Review security, administration, and workspace changes.</p>
        </div>
        <span>{entries.data?.total ?? 0} events</span>
      </header>
      <label className="admin-search audit-search">
        <Search />
        <span className="sr-only">Search audit history</span>
        <input
          value={search}
          maxLength={120}
          placeholder="Search action, target, or actor"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </label>
      <QueryGate queries={[entries]} label="Audit history">
        {entries.data?.items.length ? (
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Context</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{formatAction(entry.action)}</strong>
                      <small>{entry.action}</small>
                    </td>
                    <td>{entry.user?.fullName ?? "System"}</td>
                    <td>
                      {entry.entityType}
                      {entry.entityId && <small>{entry.entityId}</small>}
                    </td>
                    <td>
                      {metadataSummary(entry.metadata)}
                      {entry.ipAddress && <small>{entry.ipAddress}</small>}
                    </td>
                    <td>{dateFormatter.format(new Date(entry.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No audit events">
            Sensitive changes will appear here when they occur.
          </EmptyState>
        )}
        {pageCount > 1 && (
          <nav className="pagination" aria-label="Audit pages">
            <Button
              variant="quiet"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {pageCount}
            </span>
            <Button
              variant="quiet"
              disabled={page === pageCount}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </nav>
        )}
      </QueryGate>
    </section>
  );
}

function formatAction(value: string) {
  return value
    .split(".")
    .at(-1)!
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function metadataSummary(value: Record<string, unknown> | null) {
  if (!value) return "—";
  if (Array.isArray(value.fields)) return `Changed: ${value.fields.join(", ")}`;
  if (typeof value.scope === "string") return `Scope: ${value.scope}`;
  if (typeof value.email === "string") return value.email;
  return "Recorded context";
}
