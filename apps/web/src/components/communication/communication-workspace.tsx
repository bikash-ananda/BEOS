"use client";

import { Megaphone, MessageSquareText, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { useWorkspaceLive } from "@/lib/workspace-live";
import { useSession } from "../session-boundary";
import { PermissionState } from "../ui";
import { AnnouncementsPanel } from "./announcements-panel";
import { ConversationsPanel } from "./conversations-panel";
import { DiscussionsPanel } from "./discussions-panel";

type View = "discussions" | "conversations" | "announcements";

const views = [
  { id: "discussions", label: "Discussions", icon: MessageSquareText },
  { id: "conversations", label: "Conversations", icon: MessagesSquare },
  { id: "announcements", label: "Announcements", icon: Megaphone },
] as const;

export function CommunicationWorkspace() {
  const user = useSession();
  const canRead = user.permissions.includes("communication.read");
  const [view, setView] = useState<View>("discussions");
  const live = useWorkspaceLive(canRead);

  if (!canRead) {
    return (
      <main className="workspace-page">
        <PermissionState title="Communication unavailable">
          Your role does not include workspace communication access.
        </PermissionState>
      </main>
    );
  }

  return (
    <main className="workspace-page communication-page">
      <header className="page-heading communication-heading">
        <div>
          <h1>Communication</h1>
          <p>
            Discuss company work, continue scoped conversations, and review
            official announcements.
          </p>
        </div>
        <span className={`live-coordinate live-${live}`}>
          {live === "live"
            ? "Live updates active"
            : live === "connecting"
              ? "Connecting"
              : "Updates paused — retrying"}
        </span>
      </header>
      <nav className="communication-index" aria-label="Communication views">
        {views.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={view === id ? "active" : ""}
            aria-current={view === id ? "page" : undefined}
            onClick={() => setView(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
      {view === "discussions" && <DiscussionsPanel user={user} />}
      {view === "conversations" && <ConversationsPanel user={user} />}
      {view === "announcements" && <AnnouncementsPanel user={user} />}
    </main>
  );
}
