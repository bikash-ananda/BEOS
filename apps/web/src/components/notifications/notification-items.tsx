import Link from "next/link";
import type { Notification } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-NP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function NotificationItems({
  items,
  pendingId,
  onRead,
}: {
  items: Notification[];
  pendingId?: string;
  onRead: (id: string) => void;
}) {
  return (
    <div className="notification-list">
      {items.map((notification) => (
        <article
          className={`notification-item ${notification.readAt ? "" : "notification-unread"}`}
          key={notification.id}
        >
          <span className="notification-marker" aria-hidden="true" />
          <div>
            <header>
              <h3>{notification.title}</h3>
              <time dateTime={notification.createdAt}>
                {dateFormatter.format(new Date(notification.createdAt))}
              </time>
            </header>
            <p>{notification.message}</p>
            <footer>
              {notification.href && <Link href={notification.href}>Open</Link>}
              {!notification.readAt && (
                <button
                  type="button"
                  onClick={() => onRead(notification.id)}
                  disabled={pendingId === notification.id}
                >
                  {pendingId === notification.id ? "Marking…" : "Mark as read"}
                </button>
              )}
            </footer>
          </div>
        </article>
      ))}
    </div>
  );
}
