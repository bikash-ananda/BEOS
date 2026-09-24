"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type { ApiPath } from "@/lib/api";
import type { Page, WorkAttachment, WorkspaceFile } from "@/lib/types";
import { Button } from "../ui";

export function AttachmentPicker({
  endpoint,
  attachments,
  onLinked,
}: {
  endpoint: ApiPath;
  attachments: WorkAttachment[];
  onLinked: () => Promise<unknown> | unknown;
}) {
  const [fileId, setFileId] = useState("");
  const files = useQuery({
    queryKey: ["workspace-files", "work-picker"],
    queryFn: () => apiFetch<Page<WorkspaceFile>>("/workspace/files?limit=100"),
  });
  const linkedIds = new Set(attachments.map(({ file }) => file.id));
  const available =
    files.data?.items.filter(({ id }) => !linkedIds.has(id)) ?? [];
  const link = useMutation({
    mutationFn: () =>
      apiFetch(endpoint, { method: "POST", ...jsonBody({ fileId }) }),
    onSuccess: async () => {
      setFileId("");
      await onLinked();
      toast.success("File linked");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      className="attachment-picker"
      onSubmit={(event) => {
        event.preventDefault();
        link.mutate();
      }}
    >
      <label>
        <span className="sr-only">Choose a workspace file</span>
        <select
          value={fileId}
          disabled={files.isPending || link.isPending || !available.length}
          onChange={(event) => setFileId(event.target.value)}
        >
          <option value="">
            {files.isPending
              ? "Loading files…"
              : available.length
                ? "Choose workspace file"
                : "No unlinked files"}
          </option>
          {available.map((file) => (
            <option key={file.id} value={file.id}>
              {file.originalName}
            </option>
          ))}
        </select>
      </label>
      <Button variant="quiet" disabled={!fileId || link.isPending}>
        <Paperclip /> Link file
      </Button>
    </form>
  );
}
