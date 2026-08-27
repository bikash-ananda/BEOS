"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, MessageSquare } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type { AuthUser, TaskStatus, WorkTaskDetail } from "@/lib/types";
import { Button } from "../ui";
import { AttachmentPicker } from "./attachment-picker";
import { AttachmentList, workDateTime, workLabel } from "./record-shared";

export function TaskRecord({
  task,
  user,
  onMeeting,
}: {
  task: WorkTaskDetail;
  user: AuthUser;
  onMeeting: (id: string) => void;
}) {
  const client = useQueryClient();
  const [comment, setComment] = useState("");
  const refresh = () => client.invalidateQueries({ queryKey: ["work"] });
  const update = useMutation({
    mutationFn: (status: TaskStatus) =>
      apiFetch(`/work/tasks/${task.id}`, {
        method: "PATCH",
        ...jsonBody({ status }),
      }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const addComment = useMutation({
    mutationFn: () =>
      apiFetch(`/work/tasks/${task.id}/comments`, {
        method: "POST",
        ...jsonBody({ body: comment }),
      }),
    onSuccess: async () => {
      setComment("");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const assigned = task.assignees.some(({ userId }) => userId === user.id);
  const canManage =
    assigned ||
    task.createdById === user.id ||
    user.permissions.includes("tasks.manage");

  return (
    <article className="work-focus task-record">
      <header>
        <div>
          <h2>{task.title}</h2>
          <p>
            {workLabel(task.priority)} priority
            {task.dueAt
              ? ` · due ${workDateTime.format(new Date(task.dueAt))}`
              : " · no due date"}
          </p>
        </div>
        <label>
          Status
          <select
            value={task.status}
            disabled={!canManage}
            onChange={(event) =>
              update.mutate(event.target.value as TaskStatus)
            }
          >
            <option value="NOT_STARTED">Not started</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </header>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <dl className="task-fields">
        <div>
          <dt>Created by</dt>
          <dd>{task.createdBy.fullName}</dd>
        </div>
        <div>
          <dt>Assignees</dt>
          <dd>
            {task.assignees.map(({ user }) => user.fullName).join(", ") ||
              "Unassigned"}
          </dd>
        </div>
        {task.meeting && (
          <div>
            <dt>Meeting origin</dt>
            <dd>
              <button onClick={() => onMeeting(task.meeting!.id)}>
                <Link2 />
                {task.meeting.title}
              </button>
            </dd>
          </div>
        )}
        {task.agendaItem && (
          <div>
            <dt>Agenda item</dt>
            <dd>
              {task.agendaItem.position}. {task.agendaItem.title}
            </dd>
          </div>
        )}
      </dl>
      <section className="task-comments">
        <h3>
          <MessageSquare /> Comments
        </h3>
        {task.comments.map((item) => (
          <article key={item.id}>
            <header>
              <strong>{item.author.fullName}</strong>
              <time>{workDateTime.format(new Date(item.createdAt))}</time>
            </header>
            <p>{item.body}</p>
          </article>
        ))}
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            addComment.mutate();
          }}
        >
          <textarea
            aria-label="Comment"
            rows={3}
            maxLength={5000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add a work note"
          />
          <Button disabled={!comment.trim() || addComment.isPending}>
            Add comment
          </Button>
        </form>
      </section>
      <AttachmentList attachments={task.attachments}>
        {user.permissions.includes("files.read") && (
          <AttachmentPicker
            endpoint={`/work/tasks/${task.id}/attachments`}
            attachments={task.attachments}
            onLinked={refresh}
          />
        )}
      </AttachmentList>
    </article>
  );
}
