"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { NotificationPage } from "@/lib/types";
import { Button, EmptyState, QueryGate } from "../ui";
import { NotificationItems } from "./notification-items";

export function NotificationsWorkspace() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const notifications = useQuery({
    queryKey: ["notifications", "history", deferredSearch, page],
    queryFn: () => {
      const query = new URLSearchParams({ page: String(page), limit: "25" });
      if (deferredSearch) query.set("search", deferredSearch);
      return apiFetch<NotificationPage>(`/notifications?${query}`);
    },
  });
  const read = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const readAll = useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "POST" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const pageCount = Math.max(
    1,
    Math.ceil((notifications.data?.total ?? 0) / 25),
  );

  return (
    <main className="workspace-page notifications-page">
      <header className="page-heading notifications-heading">
        <div>
          <h1>Notifications</h1>
          <p>Review account and workspace changes recorded for you.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => readAll.mutate()}
          disabled={!notifications.data?.unread || readAll.isPending}
        >
          {readAll.isPending ? "Marking…" : "Mark all read"}
        </Button>
      </header>
      <section
        className="notification-register"
        aria-labelledby="notification-heading"
      >
        <header>
          <h2 id="notification-heading">History</h2>
          <span>{notifications.data?.unread ?? 0} unread</span>
        </header>
        <label className="notification-search">
          <Search />
          <span className="sr-only">Search notifications</span>
          <input
            value={search}
            maxLength={120}
            placeholder="Search notification history"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <QueryGate queries={[notifications]} label="Notifications">
          {notifications.data?.items.length ? (
            <NotificationItems
              items={notifications.data.items}
              pendingId={read.variables}
              onRead={(id) => read.mutate(id)}
            />
          ) : (
            <EmptyState title="No notifications">
              Account and workspace updates will appear here.
            </EmptyState>
          )}
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Notification pages">
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
    </main>
  );
}
