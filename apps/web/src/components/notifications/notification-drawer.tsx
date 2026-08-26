"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";
import { apiFetch } from "@/lib/api";
import type { NotificationPage } from "@/lib/types";
import { EmptyState, QueryGate } from "../ui";
import { NotificationItems } from "./notification-items";

export function NotificationDrawer({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const client = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications", "drawer"],
    queryFn: () => apiFetch<NotificationPage>("/notifications?limit=10"),
    enabled: open,
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

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open, triggerRef]);

  if (!open) return null;
  return (
    <aside
      id="notification-drawer"
      className="notification-drawer"
      role="dialog"
      aria-modal="false"
      aria-labelledby="notification-drawer-heading"
    >
      <header>
        <div>
          <h2 id="notification-drawer-heading">Notifications</h2>
          <span>{notifications.data?.unread ?? 0} unread</span>
        </div>
        <button
          ref={closeButton}
          type="button"
          onClick={() => {
            onClose();
            triggerRef.current?.focus();
          }}
          aria-label="Close notifications"
        >
          <X />
        </button>
      </header>
      <div className="notification-drawer-actions">
        <button
          type="button"
          onClick={() => readAll.mutate()}
          disabled={!notifications.data?.unread || readAll.isPending}
        >
          {readAll.isPending ? "Marking…" : "Mark all read"}
        </button>
        <Link href="/notifications" onClick={onClose}>
          View history
        </Link>
      </div>
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
      </QueryGate>
    </aside>
  );
}
