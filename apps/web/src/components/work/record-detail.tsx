"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, FileText, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type {
  AuthUser,
  MeetingDetail,
  MeetingRsvp,
  MeetingStatus,
} from "@/lib/types";
import { Button, EmptyState } from "../ui";
import { AttachmentPicker } from "./attachment-picker";
import {
  AttachmentList,
  TextEntry,
  workDateTime,
  workLabel,
} from "./record-shared";
import { TaskForm } from "./work-forms";

type MeetingEntry = "agenda" | "note" | "minute" | "decision" | "task";

export function MeetingRecord({
  meeting,
  user,
  onTask,
}: {
  meeting: MeetingDetail;
  user: AuthUser;
  onTask: (id: string) => void;
}) {
  const client = useQueryClient();
  const [entry, setEntry] = useState<MeetingEntry | null>(null);
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["work"] });
    setEntry(null);
  };
  const viewer = meeting.participants.find(({ userId }) => userId === user.id);
  const canManage =
    meeting.organizerId === user.id ||
    user.permissions.includes("meetings.manage");
  const rsvp = useMutation({
    mutationFn: (value: MeetingRsvp) =>
      apiFetch(`/work/meetings/${meeting.id}/rsvp`, {
        method: "POST",
        ...jsonBody({ rsvp: value }),
      }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const update = useMutation({
    mutationFn: (status: MeetingStatus) =>
      apiFetch(`/work/meetings/${meeting.id}`, {
        method: "PATCH",
        ...jsonBody({ status }),
      }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const add = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) =>
      apiFetch(`/work/meetings/${meeting.id}/${path}`, {
        method: "POST",
        ...jsonBody(body),
      }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <article className="work-focus meeting-record">
      <header>
        <div>
          <h2>{meeting.title}</h2>
          <p>
            {workDateTime.format(new Date(meeting.startsAt))}–
            {new Intl.DateTimeFormat("en-NP", { timeStyle: "short" }).format(
              new Date(meeting.endsAt),
            )}
            {meeting.location ? ` · ${meeting.location}` : ""}
          </p>
        </div>
        <span className={`work-state state-${meeting.status.toLowerCase()}`}>
          {workLabel(meeting.status)}
        </span>
      </header>
      <div className="meeting-command">
        <span>Organizer: {meeting.organizer.fullName}</span>
        <span>{meeting.participants.length} participants</span>
        {canManage && (
          <MeetingStatusSelect
            value={meeting.status}
            disabled={update.isPending}
            onChange={(value) => update.mutate(value)}
          />
        )}
        {viewer && (
          <RsvpSelect
            value={viewer.rsvp}
            disabled={rsvp.isPending}
            onChange={(value) => rsvp.mutate(value)}
          />
        )}
      </div>
      <MeetingTools onSelect={setEntry} />
      {entry === "agenda" && (
        <TextEntry
          title="Add agenda item"
          onCancel={() => setEntry(null)}
          onSubmit={(body) =>
            add.mutate({ path: "agenda", body: { title: body } })
          }
        />
      )}
      {(entry === "note" || entry === "minute") && (
        <TextEntry
          title={`Add ${entry}`}
          multiline
          onCancel={() => setEntry(null)}
          onSubmit={(body) =>
            add.mutate({
              path: "notes",
              body: { body, kind: entry === "note" ? "NOTE" : "MINUTE" },
            })
          }
        />
      )}
      {entry === "decision" && (
        <TextEntry
          title="Record decision"
          multiline
          onCancel={() => setEntry(null)}
          onSubmit={(body) => add.mutate({ path: "decisions", body: { body } })}
        />
      )}
      {entry === "task" && (
        <TaskForm
          meetingId={meeting.id}
          onClose={() => setEntry(null)}
          onCreated={(task) => {
            void refresh();
            onTask(task.id);
          }}
        />
      )}
      <AgendaTrace meeting={meeting} onTask={onTask} />
      {(meeting.notes.length > 0 || meeting.decisions.length > 0) && (
        <section className="general-outcomes">
          <h3>General record</h3>
          {meeting.notes.map((note) => (
            <p key={note.id}>
              <strong>{workLabel(note.kind)}</strong>
              {note.body}
            </p>
          ))}
          {meeting.decisions.map((decision) => (
            <p key={decision.id}>
              <strong>Decision</strong>
              {decision.body}
            </p>
          ))}
        </section>
      )}
      <AttachmentList attachments={meeting.attachments}>
        {canManage && user.permissions.includes("files.read") && (
          <AttachmentPicker
            endpoint={`/work/meetings/${meeting.id}/attachments`}
            attachments={meeting.attachments}
            onLinked={refresh}
          />
        )}
      </AttachmentList>
    </article>
  );
}

function MeetingTools({
  onSelect,
}: {
  onSelect: (entry: MeetingEntry) => void;
}) {
  return (
    <nav className="record-tools" aria-label="Meeting record actions">
      <Button variant="quiet" onClick={() => onSelect("agenda")}>
        <Plus /> Agenda item
      </Button>
      <Button variant="quiet" onClick={() => onSelect("note")}>
        <FileText /> Note
      </Button>
      <Button variant="quiet" onClick={() => onSelect("minute")}>
        <FileText /> Minute
      </Button>
      <Button variant="quiet" onClick={() => onSelect("decision")}>
        <CheckSquare /> Decision
      </Button>
      <Button variant="quiet" onClick={() => onSelect("task")}>
        <Plus /> Linked task
      </Button>
    </nav>
  );
}

function AgendaTrace({
  meeting,
  onTask,
}: {
  meeting: MeetingDetail;
  onTask: (id: string) => void;
}) {
  return (
    <section className="agenda-trace">
      <header>
        <h3>Agenda and outcomes</h3>
        <span>{meeting.agendaItems.length} items</span>
      </header>
      {meeting.agendaItems.length ? (
        meeting.agendaItems.map((item) => (
          <div className="agenda-row" key={item.id}>
            <div className="agenda-subject">
              <b>{item.position}</b>
              <span>
                <strong>{item.title}</strong>
                {item.details && <small>{item.details}</small>}
              </span>
            </div>
            <div className="agenda-outcomes">
              {item.notes.map((note) => (
                <p key={note.id}>
                  <FileText />
                  <span>
                    <strong>{workLabel(note.kind)}</strong>
                    {note.body}
                  </span>
                </p>
              ))}
              {item.decisions.map((decision) => (
                <p key={decision.id}>
                  <CheckSquare />
                  <span>
                    <strong>Decision</strong>
                    {decision.body}
                  </span>
                </p>
              ))}
              {!item.notes.length && !item.decisions.length && (
                <small>No recorded outcome.</small>
              )}
            </div>
            <div className="agenda-tasks">
              {item.tasks.map((task) => (
                <button key={task.id} onClick={() => onTask(task.id)}>
                  <CheckSquare />
                  <span>
                    {task.title}
                    <small>{workLabel(task.status)}</small>
                  </span>
                </button>
              ))}
              {!item.tasks.length && <small>No linked tasks.</small>}
            </div>
          </div>
        ))
      ) : (
        <EmptyState title="No agenda items">
          Add the first agenda item when the meeting purpose is ready.
        </EmptyState>
      )}
    </section>
  );
}

function MeetingStatusSelect({
  value,
  disabled,
  onChange,
}: {
  value: MeetingStatus;
  disabled: boolean;
  onChange: (value: MeetingStatus) => void;
}) {
  return (
    <label>
      Meeting
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as MeetingStatus)}
      >
        <option value="SCHEDULED">Scheduled</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </label>
  );
}

function RsvpSelect({
  value,
  disabled,
  onChange,
}: {
  value: MeetingRsvp;
  disabled: boolean;
  onChange: (value: MeetingRsvp) => void;
}) {
  return (
    <label>
      RSVP
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as MeetingRsvp)}
      >
        <option value="PENDING">Pending</option>
        <option value="ACCEPTED">Accepted</option>
        <option value="TENTATIVE">Tentative</option>
        <option value="DECLINED">Declined</option>
      </select>
    </label>
  );
}
