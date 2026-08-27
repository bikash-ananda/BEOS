"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import type { MeetingDetail } from "@/lib/types";
import { Button } from "../ui";

export const workDateTime = new Intl.DateTimeFormat("en-NP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const workLabel = (value: string) =>
  value.toLowerCase().replaceAll("_", " ");

export function TextEntry({
  title,
  multiline = false,
  onCancel,
  onSubmit,
}: {
  title: string;
  multiline?: boolean;
  onCancel: () => void;
  onSubmit: (body: string) => void;
}) {
  const [body, setBody] = useState("");
  return (
    <form
      className="inline-entry"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(body);
      }}
    >
      <label>
        <span>{title}</span>
        {multiline ? (
          <textarea
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        ) : (
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        )}
      </label>
      <div>
        <Button disabled={!body.trim()}>Save</Button>
        <Button type="button" variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AttachmentList({
  attachments,
  children,
}: {
  attachments: MeetingDetail["attachments"];
  children?: React.ReactNode;
}) {
  if (!attachments.length && !children) return null;
  return (
    <section className="work-attachments">
      <h3>Attachments</h3>
      <div className="attachment-links">
        {attachments.map(({ file }) => (
          <a key={file.id} href={`/api/v1/workspace/files/${file.id}/download`}>
            <FileText />
            {file.originalName}
          </a>
        ))}
        {!attachments.length && <small>No linked files.</small>}
      </div>
      {children}
    </section>
  );
}
