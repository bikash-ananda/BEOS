"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Search } from "lucide-react";
import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type {
  AuthUser,
  Discussion,
  DiscussionComment,
  Page,
  ReactionKind,
} from "@/lib/types";
import { Button, EmptyState, QueryGate } from "../ui";
import { ReactionControls } from "./reaction-controls";

const dateFormatter = new Intl.DateTimeFormat("en-NP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DiscussionsPanel({ user }: { user: AuthUser }) {
  const client = useQueryClient();
  const canWrite = user.permissions.includes("communication.write");
  const canManage = user.permissions.includes("communication.manage");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const discussions = useQuery({
    queryKey: ["communication", "discussions", deferredSearch, page],
    queryFn: () => {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (deferredSearch) query.set("search", deferredSearch);
      return apiFetch<Page<Discussion>>(`/communication/discussions?${query}`);
    },
  });
  useEffect(() => {
    if (!selectedId && discussions.data?.items[0]) {
      setSelectedId(discussions.data.items[0].id);
    }
  }, [discussions.data, selectedId]);
  const selected = discussions.data?.items.find(
    (discussion) => discussion.id === selectedId,
  );

  async function refresh() {
    await client.invalidateQueries({
      queryKey: ["communication", "discussions"],
    });
  }

  return (
    <section className="communication-workbench" aria-label="Discussions">
      <div className="communication-register">
        <header>
          <h2>Company discussions</h2>
          {canWrite && (
            <Button onClick={() => setComposing((value) => !value)}>
              <MessageSquarePlus />
              {composing ? "Close" : "New discussion"}
            </Button>
          )}
        </header>
        {composing && (
          <DiscussionForm
            onCancel={() => setComposing(false)}
            onSaved={async (discussion) => {
              setComposing(false);
              setSelectedId(discussion.id);
              await refresh();
            }}
          />
        )}
        <label className="communication-search">
          <Search />
          <span className="sr-only">Search discussions</span>
          <input
            value={search}
            maxLength={120}
            placeholder="Search discussions"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <QueryGate queries={[discussions]} label="Discussions">
          {discussions.data?.items.length ? (
            <div className="record-index">
              {discussions.data.items.map((discussion) => (
                <button
                  key={discussion.id}
                  type="button"
                  className={selectedId === discussion.id ? "active" : ""}
                  onClick={() => setSelectedId(discussion.id)}
                >
                  <strong>{discussion.title}</strong>
                  <span>{discussion.author.fullName}</span>
                  <small>
                    {discussion._count.comments} comments ·{" "}
                    {dateFormatter.format(new Date(discussion.createdAt))}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No discussions yet">
              Start one when there is real company work to discuss.
            </EmptyState>
          )}
          <Pager
            page={page}
            total={discussions.data?.total ?? 0}
            limit={20}
            onPage={setPage}
          />
        </QueryGate>
      </div>
      <div className="communication-focus">
        {selected ? (
          <DiscussionDetail
            discussion={selected}
            user={user}
            canWrite={canWrite}
            canManage={canManage}
            onChanged={refresh}
            onDeleted={async () => {
              setSelectedId(null);
              await refresh();
            }}
          />
        ) : (
          <EmptyState title="Choose a discussion">
            Select a record to read its full thread.
          </EmptyState>
        )}
      </div>
    </section>
  );
}

function DiscussionDetail({
  discussion,
  user,
  canWrite,
  canManage,
  onChanged,
  onDeleted,
}: {
  discussion: Discussion;
  user: AuthUser;
  canWrite: boolean;
  canManage: boolean;
  onChanged: () => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");
  const comments = useQuery({
    queryKey: ["communication", "discussion-comments", discussion.id],
    queryFn: () =>
      apiFetch<Page<DiscussionComment>>(
        `/communication/discussions/${discussion.id}/comments?limit=100`,
      ),
  });
  const invalidate = async () => {
    await Promise.all([
      onChanged(),
      client.invalidateQueries({
        queryKey: ["communication", "discussion-comments", discussion.id],
      }),
    ]);
  };
  const react = useMutation({
    mutationFn: (kind: ReactionKind | null) =>
      apiFetch(`/communication/discussions/${discussion.id}/reaction`, {
        method: kind ? "PUT" : "DELETE",
        ...(kind && jsonBody({ kind })),
      }),
    onSuccess: invalidate,
  });
  const addComment = useMutation({
    mutationFn: () =>
      apiFetch(`/communication/discussions/${discussion.id}/comments`, {
        method: "POST",
        ...jsonBody({ body: comment }),
      }),
    onSuccess: async () => {
      setComment("");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: () =>
      apiFetch(`/communication/discussions/${discussion.id}`, {
        method: "DELETE",
      }),
    onSuccess: onDeleted,
    onError: (error: Error) => toast.error(error.message),
  });
  const owns = discussion.authorId === user.id || canManage;

  if (editing) {
    return (
      <DiscussionForm
        discussion={discussion}
        onCancel={() => setEditing(false)}
        onSaved={async () => {
          setEditing(false);
          await onChanged();
        }}
      />
    );
  }
  return (
    <article className="discussion-detail">
      <header>
        <div>
          <h2>{discussion.title}</h2>
          <p>
            {discussion.author.fullName} ·{" "}
            {dateFormatter.format(new Date(discussion.createdAt))}
            {discussion.editedAt ? " · Edited" : ""}
          </p>
        </div>
        {owns && (
          <div className="record-actions">
            <Button variant="quiet" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Delete
            </Button>
          </div>
        )}
      </header>
      <p className="record-body">{discussion.body}</p>
      {canWrite && (
        <ReactionControls
          summary={discussion}
          disabled={react.isPending}
          onChange={(kind) => react.mutate(kind)}
        />
      )}
      <section className="comment-thread" aria-label="Comments">
        <h3>Comments</h3>
        <QueryGate queries={[comments]} label="Comments">
          {comments.data?.items.length ? (
            comments.data.items.map((item) => (
              <CommentRecord
                key={item.id}
                item={item}
                user={user}
                canManage={canManage}
                canWrite={canWrite}
                onChanged={invalidate}
              />
            ))
          ) : (
            <p className="quiet-copy">No comments yet.</p>
          )}
        </QueryGate>
        {canWrite && (
          <form
            className="compact-composer"
            onSubmit={(event) => {
              event.preventDefault();
              if (comment.trim()) addComment.mutate();
            }}
          >
            <label>
              <span>Add a comment</span>
              <textarea
                value={comment}
                maxLength={5000}
                rows={3}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <Button disabled={!comment.trim() || addComment.isPending}>
              {addComment.isPending ? "Posting…" : "Post comment"}
            </Button>
          </form>
        )}
      </section>
    </article>
  );
}

function CommentRecord({
  item,
  user,
  canManage,
  canWrite,
  onChanged,
}: {
  item: DiscussionComment;
  user: AuthUser;
  canManage: boolean;
  canWrite: boolean;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(item.body);
  const mutation = useMutation({
    mutationFn: ({ method, nextBody }: { method: string; nextBody?: string }) =>
      apiFetch(`/communication/discussions/comments/${item.id}`, {
        method,
        ...(nextBody && jsonBody({ body: nextBody })),
      }),
    onSuccess: async () => {
      setEditing(false);
      await onChanged();
    },
  });
  const react = useMutation({
    mutationFn: (kind: ReactionKind | null) =>
      apiFetch(`/communication/discussions/comments/${item.id}/reaction`, {
        method: kind ? "PUT" : "DELETE",
        ...(kind && jsonBody({ kind })),
      }),
    onSuccess: onChanged,
  });
  const owns = item.authorId === user.id || canManage;
  return (
    <article className="comment-record">
      <header>
        <strong>{item.author.fullName}</strong>
        <small>
          {dateFormatter.format(new Date(item.createdAt))}
          {item.editedAt ? " · Edited" : ""}
        </small>
      </header>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({ method: "PATCH", nextBody: body.trim() });
          }}
        >
          <textarea
            value={body}
            maxLength={5000}
            rows={3}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="record-actions">
            <Button disabled={!body.trim() || mutation.isPending}>Save</Button>
            <Button
              variant="quiet"
              type="button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p>{item.body}</p>
      )}
      <footer>
        {canWrite && (
          <ReactionControls
            summary={item}
            disabled={react.isPending}
            onChange={(kind) => react.mutate(kind)}
          />
        )}
        {owns && !editing && (
          <div className="record-actions">
            <button type="button" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate({ method: "DELETE" })}
            >
              Delete
            </button>
          </div>
        )}
      </footer>
    </article>
  );
}

function DiscussionForm({
  discussion,
  onCancel,
  onSaved,
}: {
  discussion?: Discussion;
  onCancel: () => void;
  onSaved: (discussion: Discussion) => Promise<void>;
}) {
  const [title, setTitle] = useState(discussion?.title ?? "");
  const [body, setBody] = useState(discussion?.body ?? "");
  const save = useMutation({
    mutationFn: () => {
      const endpoint = discussion
        ? (`/communication/discussions/${discussion.id}` as const)
        : ("/communication/discussions" as const);
      return apiFetch<Discussion>(endpoint, {
        method: discussion ? "PATCH" : "POST",
        ...jsonBody({ title: title.trim(), body: body.trim() }),
      });
    },
    onSuccess: onSaved,
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <form
      className="record-composer"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <label>
        <span>Discussion title</span>
        <input
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        <span>Discussion</span>
        <textarea
          value={body}
          maxLength={10000}
          rows={6}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <div className="record-actions">
        <Button
          disabled={title.trim().length < 3 || !body.trim() || save.isPending}
        >
          {save.isPending ? "Saving…" : discussion ? "Save changes" : "Publish"}
        </Button>
        <Button type="button" variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Pager({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Discussion pages">
      <Button
        variant="quiet"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} of {pages}
      </span>
      <Button
        variant="quiet"
        disabled={page === pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
