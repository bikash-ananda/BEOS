"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, CheckSquare, ListChecks, Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  MeetingDetail,
  MeetingSummary,
  Page,
  WorkTaskDetail,
  WorkTaskSummary,
} from "@/lib/types";
import { useWorkspaceLive } from "@/lib/workspace-live";
import { useSession } from "../session-boundary";
import { Button, EmptyState, PermissionState, QueryGate } from "../ui";
import { MeetingRecord } from "./record-detail";
import { TaskRecord } from "./task-record";
import { MeetingForm, TaskForm } from "./work-forms";

type Focus = { type: "meeting" | "task"; id: string } | null;
const dateTime = new Intl.DateTimeFormat("en-NP", {
  dateStyle: "medium",
  timeStyle: "short",
});
const shortDate = new Intl.DateTimeFormat("en-NP", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const label = (value: string) => value.toLowerCase().replaceAll("_", " ");

export function WorkWorkspace({
  initialFocus = null,
}: {
  initialFocus?: Focus;
}) {
  const user = useSession();
  const canRead =
    user.permissions.includes("meetings.read") &&
    user.permissions.includes("tasks.read");
  const canWrite =
    user.permissions.includes("meetings.write") &&
    user.permissions.includes("tasks.write");
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [focus, setFocus] = useState<Focus>(initialFocus);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [composer, setComposer] = useState<"meeting" | "task" | null>(null);
  const [mobileView, setMobileView] = useState<"meetings" | "tasks">(
    "meetings",
  );
  const live = useWorkspaceLive(canRead);
  const dateQuery = selectedDate ? dayQuery(selectedDate) : "";
  const meetings = useQuery({
    queryKey: ["work", "meetings", deferredSearch, selectedDate],
    queryFn: () =>
      apiFetch<Page<MeetingSummary>>(
        `/work/meetings?limit=50${dateQuery}${deferredSearch ? `&search=${encodeURIComponent(deferredSearch)}` : ""}`,
      ),
    enabled: canRead,
  });
  const tasks = useQuery({
    queryKey: ["work", "tasks", deferredSearch, selectedDate],
    queryFn: () =>
      apiFetch<Page<WorkTaskSummary>>(
        `/work/tasks?limit=50${dateQuery}${deferredSearch ? `&search=${encodeURIComponent(deferredSearch)}` : ""}`,
      ),
    enabled: canRead,
  });
  const meeting = useQuery({
    queryKey: ["work", "meeting", focus?.type === "meeting" ? focus.id : null],
    queryFn: () => apiFetch<MeetingDetail>(`/work/meetings/${focus!.id}`),
    enabled: focus?.type === "meeting",
  });
  const task = useQuery({
    queryKey: ["work", "task", focus?.type === "task" ? focus.id : null],
    queryFn: () => apiFetch<WorkTaskDetail>(`/work/tasks/${focus!.id}`),
    enabled: focus?.type === "task",
  });
  useEffect(() => {
    if (focus || meetings.isPending || tasks.isPending) return;
    const firstMeeting = meetings.data?.items[0];
    const firstTask = tasks.data?.items[0];
    if (firstMeeting) setFocus({ type: "meeting", id: firstMeeting.id });
    else if (firstTask) setFocus({ type: "task", id: firstTask.id });
  }, [focus, meetings.data, meetings.isPending, tasks.data, tasks.isPending]);
  if (!canRead)
    return (
      <main className="workspace-page">
        <PermissionState title="Work register unavailable">
          Your role does not include meeting and task access.
        </PermissionState>
      </main>
    );
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["work"] });
    setComposer(null);
  };
  const days = Array.from({ length: 6 }, (_, index) => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    value.setDate(value.getDate() + index);
    return value;
  });
  return (
    <main className="workspace-page work-page">
      <header className="page-heading work-heading">
        <div>
          <h1>Meetings &amp; Tasks</h1>
          <p>
            Plan meetings, record decisions, and carry assigned work through
            completion.
          </p>
        </div>
        <div className="work-heading-actions">
          <span className={`live-coordinate live-${live}`}>
            {live === "live"
              ? "Live updates active"
              : live === "connecting"
                ? "Connecting"
                : "Updates paused — retrying"}
          </span>
          {canWrite && (
            <>
              <Button onClick={() => setComposer("meeting")}>
                <CalendarPlus /> Schedule meeting
              </Button>
              <Button variant="secondary" onClick={() => setComposer("task")}>
                <CheckSquare /> New task
              </Button>
            </>
          )}
        </div>
      </header>
      <nav className="work-date-strip" aria-label="Filter work by date">
        <button
          className={selectedDate === null ? "active" : ""}
          onClick={() => setSelectedDate(null)}
        >
          <span>All</span>
          <strong>Open register</strong>
        </button>
        {days.map((day, index) => {
          const key = localDateKey(day);
          return (
            <button
              key={key}
              className={selectedDate === key ? "active" : ""}
              onClick={() => setSelectedDate(key)}
            >
              <span>
                {index === 0 ? "Today" : shortDate.format(day).split(",")[0]}
              </span>
              <strong>{shortDate.format(day).replace(/^[^,]+,\s*/, "")}</strong>
            </button>
          );
        })}
      </nav>
      {composer === "meeting" && (
        <MeetingForm
          onClose={() => setComposer(null)}
          onCreated={(record) => {
            void refresh();
            setFocus({ type: "meeting", id: record.id });
          }}
        />
      )}
      {composer === "task" && (
        <TaskForm
          onClose={() => setComposer(null)}
          onCreated={(record) => {
            void refresh();
            setFocus({ type: "task", id: record.id });
          }}
        />
      )}
      <label className="work-search">
        <Search />
        <span className="sr-only">Search meetings and tasks</span>
        <input
          value={search}
          maxLength={120}
          placeholder="Search work records"
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <nav className="work-mobile-index" aria-label="Work registers">
        <button
          className={mobileView === "meetings" ? "active" : ""}
          onClick={() => setMobileView("meetings")}
        >
          <CalendarPlus />
          Meetings
        </button>
        <button
          className={mobileView === "tasks" ? "active" : ""}
          onClick={() => setMobileView("tasks")}
        >
          <ListChecks />
          Tasks
        </button>
      </nav>
      <QueryGate queries={[meetings, tasks]} label="Work records">
        <section className="twin-registers">
          <WorkRegister
            title="Meetings"
            count={meetings.data?.total ?? 0}
            className={mobileView === "meetings" ? "mobile-active" : ""}
          >
            {meetings.data?.items.length ? (
              meetings.data.items.map((item) => (
                <button
                  key={item.id}
                  className={
                    focus?.type === "meeting" && focus.id === item.id
                      ? "active"
                      : ""
                  }
                  onClick={() => setFocus({ type: "meeting", id: item.id })}
                >
                  <time>{dateTime.format(new Date(item.startsAt))}</time>
                  <strong>{item.title}</strong>
                  <span>
                    {item.organizer.fullName} · {item.participants.length}{" "}
                    people
                  </span>
                  <small>
                    {item.participants.find(({ userId }) => userId === user.id)
                      ?.rsvp
                      ? label(
                          item.participants.find(
                            ({ userId }) => userId === user.id,
                          )!.rsvp,
                        )
                      : label(item.status)}
                  </small>
                </button>
              ))
            ) : (
              <EmptyState title="No meetings">
                Scheduled meetings involving you will appear here.
              </EmptyState>
            )}
          </WorkRegister>
          <WorkRegister
            title="Tasks"
            count={tasks.data?.total ?? 0}
            className={mobileView === "tasks" ? "mobile-active" : ""}
          >
            {tasks.data?.items.length ? (
              tasks.data.items.map((item) => (
                <button
                  key={item.id}
                  className={
                    focus?.type === "task" && focus.id === item.id
                      ? "active"
                      : ""
                  }
                  onClick={() => setFocus({ type: "task", id: item.id })}
                >
                  <time>
                    {item.dueAt
                      ? `Due ${dateTime.format(new Date(item.dueAt))}`
                      : "No due date"}
                  </time>
                  <strong>{item.title}</strong>
                  <span>
                    {item.assignees
                      .map(({ user }) => user.fullName)
                      .join(", ") || "Unassigned"}
                  </span>
                  <small>
                    {label(item.priority)} · {label(item.status)}
                  </small>
                </button>
              ))
            ) : (
              <EmptyState title="No tasks">
                Assigned and created tasks will appear here.
              </EmptyState>
            )}
          </WorkRegister>
        </section>
      </QueryGate>
      <QueryGate
        queries={
          focus?.type === "meeting"
            ? [meeting]
            : focus?.type === "task"
              ? [task]
              : []
        }
        label="Selected record"
      >
        {meeting.data && focus?.type === "meeting" ? (
          <MeetingRecord
            meeting={meeting.data}
            user={user}
            onTask={(id) => setFocus({ type: "task", id })}
          />
        ) : task.data && focus?.type === "task" ? (
          <TaskRecord
            task={task.data}
            user={user}
            onMeeting={(id) => setFocus({ type: "meeting", id })}
          />
        ) : !focus ? (
          <EmptyState title="No work record selected">
            Choose a meeting or task to open its full record.
          </EmptyState>
        ) : null}
      </QueryGate>
    </main>
  );
}

function WorkRegister({
  title,
  count,
  className,
  children,
}: {
  title: string;
  count: number;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`work-register ${className}`}>
      <header>
        <h2>{title}</h2>
        <span>{count} records</span>
      </header>
      <div>{children}</div>
    </section>
  );
}

function localDateKey(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

function dayQuery(value: string) {
  const from = new Date(`${value}T00:00:00`);
  const to = new Date(`${value}T23:59:59.999`);
  return `&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
}
