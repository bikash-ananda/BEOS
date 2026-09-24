"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type {
  MeetingDetail,
  Page,
  WorkPerson,
  WorkTaskDetail,
} from "@/lib/types";
import { Button, QueryGate } from "../ui";

function PeopleChoices({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const people = useQuery({
    queryKey: ["work", "people"],
    queryFn: () => apiFetch<Page<WorkPerson>>("/work/people?limit=100"),
  });
  return (
    <fieldset className="work-people">
      <legend>People</legend>
      <QueryGate queries={[people]} label="People">
        {people.data?.items.map((person) => (
          <label key={person.id}>
            <input
              type="checkbox"
              checked={selected.includes(person.id)}
              onChange={() =>
                onChange(
                  selected.includes(person.id)
                    ? selected.filter((id) => id !== person.id)
                    : [...selected, person.id],
                )
              }
            />
            <span>
              <strong>{person.fullName}</strong>
              <small>
                {person.department?.name ??
                  person.branch?.name ??
                  "Company-wide"}
              </small>
            </span>
          </label>
        ))}
      </QueryGate>
    </fieldset>
  );
}

export function MeetingForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (meeting: MeetingDetail) => void;
}) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const create = useMutation({
    mutationFn: () =>
      apiFetch<MeetingDetail>("/work/meetings", {
        method: "POST",
        ...jsonBody({
          title,
          location,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          participantIds,
        }),
      }),
    onSuccess: onCreated,
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <form
      className="work-composer"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        create.mutate();
      }}
    >
      <header>
        <h2>Schedule meeting</h2>
        <Button type="button" variant="quiet" onClick={onClose}>
          Close
        </Button>
      </header>
      <label>
        <span>Title</span>
        <input
          required
          minLength={3}
          maxLength={160}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        <span>Location</span>
        <input
          maxLength={200}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
      </label>
      <div className="work-form-row">
        <label>
          <span>Starts</span>
          <input
            required
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </label>
        <label>
          <span>Ends</span>
          <input
            required
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </label>
      </div>
      <PeopleChoices selected={participantIds} onChange={setParticipantIds} />
      <Button
        disabled={!title.trim() || !startsAt || !endsAt || create.isPending}
      >
        {create.isPending ? "Scheduling…" : "Schedule meeting"}
      </Button>
    </form>
  );
}

export function TaskForm({
  meetingId,
  agendaItemId,
  onClose,
  onCreated,
}: {
  meetingId?: string;
  agendaItemId?: string;
  onClose: () => void;
  onCreated: (task: WorkTaskDetail) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [dueAt, setDueAt] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const create = useMutation({
    mutationFn: () =>
      apiFetch<WorkTaskDetail>("/work/tasks", {
        method: "POST",
        ...jsonBody({
          title,
          description,
          priority,
          ...(dueAt && { dueAt: new Date(dueAt).toISOString() }),
          meetingId,
          agendaItemId,
          assigneeIds,
        }),
      }),
    onSuccess: onCreated,
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <form
      className="work-composer"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        create.mutate();
      }}
    >
      <header>
        <h2>New task</h2>
        <Button type="button" variant="quiet" onClick={onClose}>
          Close
        </Button>
      </header>
      <label>
        <span>Task</span>
        <input
          required
          minLength={3}
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        <span>Description</span>
        <textarea
          maxLength={10000}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <div className="work-form-row">
        <label>
          <span>Priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </label>
        <label>
          <span>Due</span>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </label>
      </div>
      <PeopleChoices selected={assigneeIds} onChange={setAssigneeIds} />
      <Button
        disabled={!title.trim() || !assigneeIds.length || create.isPending}
      >
        {create.isPending ? "Creating…" : "Create task"}
      </Button>
    </form>
  );
}
