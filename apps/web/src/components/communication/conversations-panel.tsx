"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Search, Send } from "lucide-react";
import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type {
  AuthUser,
  Conversation,
  ConversationMessage,
  Page,
} from "@/lib/types";
import { Button, EmptyState, QueryGate } from "../ui";
import { NewConversationForm } from "./new-conversation-form";

const timeFormatter = new Intl.DateTimeFormat("en-NP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ConversationsPanel({ user }: { user: AuthUser }) {
  const client = useQueryClient();
  const canWrite = user.permissions.includes("communication.write");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const conversations = useQuery({
    queryKey: ["communication", "conversations", deferredSearch],
    queryFn: () => {
      const query = new URLSearchParams({ limit: "50" });
      if (deferredSearch) query.set("search", deferredSearch);
      return apiFetch<Page<Conversation>>(`/communication/conversations?${query}`);
    },
  });
  useEffect(() => {
    if (!selectedId && conversations.data?.items[0]) {
      setSelectedId(conversations.data.items[0].id);
    }
  }, [conversations.data, selectedId]);
  const selected = conversations.data?.items.find(
    (conversation) => conversation.id === selectedId,
  );

  async function refresh() {
    await client.invalidateQueries({ queryKey: ["communication", "conversations"] });
  }

  return (
    <section className="communication-workbench" aria-label="Conversations">
      <div className="communication-register">
        <header>
          <h2>Conversations</h2>
          {canWrite && (
            <Button onClick={() => setCreating((value) => !value)}>
              <MessageSquarePlus />
              {creating ? "Close" : "New"}
            </Button>
          )}
        </header>
        {creating && (
          <NewConversationForm
            user={user}
            onCancel={() => setCreating(false)}
            onCreated={async (conversation) => {
              setCreating(false);
              setSelectedId(conversation.id);
              await refresh();
            }}
          />
        )}
        <label className="communication-search">
          <Search />
          <span className="sr-only">Search conversations</span>
          <input
            value={search}
            maxLength={120}
            placeholder="Search conversations"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <QueryGate queries={[conversations]} label="Conversations">
          {conversations.data?.items.length ? (
            <div className="record-index">
              {conversations.data.items.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={selectedId === conversation.id ? "active" : ""}
                  onClick={() => setSelectedId(conversation.id)}
                >
                  <strong>{conversationName(conversation, user.id)}</strong>
                  <span>{conversation.type.replace("_", " ").toLowerCase()}</span>
                  <small>
                    {conversation.messages[0]?.body ?? "No messages yet"}
                    {conversation.unread ? ` · ${conversation.unread} unread` : ""}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No conversations">
              Create a direct or scoped conversation when work requires one.
            </EmptyState>
          )}
        </QueryGate>
      </div>
      <div className="communication-focus conversation-focus">
        {selected ? (
          <ConversationThread conversation={selected} user={user} />
        ) : (
          <EmptyState title="Choose a conversation">
            Select a record to read and reply.
          </EmptyState>
        )}
      </div>
    </section>
  );
}

function ConversationThread({
  conversation,
  user,
}: {
  conversation: Conversation;
  user: AuthUser;
}) {
  const client = useQueryClient();
  const canWrite = user.permissions.includes("communication.write");
  const canManage = user.permissions.includes("communication.manage");
  const [body, setBody] = useState("");
  const messages = useQuery({
    queryKey: ["communication", "messages", conversation.id],
    queryFn: () =>
      apiFetch<Page<ConversationMessage>>(
        `/communication/conversations/${conversation.id}/messages?limit=100`,
      ),
  });
  const read = useMutation({
    mutationFn: () =>
      apiFetch(`/communication/conversations/${conversation.id}/read`, {
        method: "POST",
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["communication", "conversations"] }),
  });
  useEffect(() => {
    read.mutate();
    // The conversation id is the read boundary; mutation identity is intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);
  const send = useMutation({
    mutationFn: () =>
      apiFetch(`/communication/conversations/${conversation.id}/messages`, {
        method: "POST",
        ...jsonBody({ body }),
      }),
    onSuccess: async () => {
      setBody("");
      await client.invalidateQueries({ queryKey: ["communication"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="conversation-thread">
      <header>
        <div>
          <h2>{conversationName(conversation, user.id)}</h2>
          <p>
            {conversation.type.replace("_", " ").toLowerCase()} · {" "}
            {conversation.members.length || "Company scope"}
            {conversation.members.length ? " members" : ""}
          </p>
        </div>
      </header>
      <QueryGate queries={[messages]} label="Messages">
        <div className="message-ledger" aria-live="polite">
          {messages.data?.items.length ? (
            messages.data.items.map((message) => (
              <MessageRecord
                key={message.id}
                message={message}
                canChange={message.authorId === user.id || canManage}
              />
            ))
          ) : (
            <EmptyState title="No messages yet">
              Send the first message when there is real work to coordinate.
            </EmptyState>
          )}
        </div>
      </QueryGate>
      {canWrite && (
        <form
          className="message-composer"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            if (body.trim()) send.mutate();
          }}
        >
          <label>
            <span>Message</span>
            <textarea
              value={body}
              rows={3}
              maxLength={10000}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
          <Button disabled={!body.trim() || send.isPending}>
            <Send /> {send.isPending ? "Sending…" : "Send message"}
          </Button>
        </form>
      )}
    </section>
  );
}

function MessageRecord({
  message,
  canChange,
}: {
  message: ConversationMessage;
  canChange: boolean;
}) {
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(message.body);
  const change = useMutation({
    mutationFn: (method: "PATCH" | "DELETE") =>
      apiFetch(`/communication/messages/${message.id}`, {
        method,
        ...(method === "PATCH" && jsonBody({ body: body.trim() })),
      }),
    onSuccess: async () => {
      setEditing(false);
      await client.invalidateQueries({ queryKey: ["communication"] });
    },
  });
  return (
    <article className="message-record">
      <header>
        <strong>{message.author.fullName}</strong>
        <small>
          {timeFormatter.format(new Date(message.createdAt))}
          {message.editedAt ? " · Edited" : ""}
        </small>
      </header>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            change.mutate("PATCH");
          }}
        >
          <textarea
            value={body}
            rows={3}
            maxLength={10000}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="record-actions">
            <Button disabled={!body.trim() || change.isPending}>Save</Button>
            <Button type="button" variant="quiet" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p>{message.body}</p>
      )}
      {canChange && !editing && (
        <footer className="record-actions">
          <button type="button" onClick={() => setEditing(true)}>Edit</button>
          <button type="button" onClick={() => change.mutate("DELETE")}>Delete</button>
        </footer>
      )}
    </article>
  );
}

function conversationName(conversation: Conversation, userId: string) {
  if (conversation.name) return conversation.name;
  return (
    conversation.members.find(({ user }) => user.id !== userId)?.user.fullName ??
    "Direct conversation"
  );
}
