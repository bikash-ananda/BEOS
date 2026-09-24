"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { AuthUser, WorkspaceFileScope } from "@/lib/types";
import { Button } from "../ui";

const maxSize = 10_485_760;

export function FileUploadForm({
  user,
  onClose,
}: {
  user: AuthUser;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const scopes = availableScopes(user);
  const [scope, setScope] = useState<WorkspaceFileScope>(scopes[0].value);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState("");
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file to upload");
      if (file.size > maxSize) throw new Error("File must be 10 MB or smaller");
      const body = new FormData();
      body.append("file", file);
      return apiFetch(`/workspace/files?scope=${scope}`, {
        method: "POST",
        body,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["workspace-files"] });
      toast.success("File uploaded");
      setFile(undefined);
      if (input.current) input.current.value = "";
      onClose();
    },
    onError: (value: Error) => setError(value.message),
  });

  return (
    <form
      className="file-upload-form"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        upload.mutate();
      }}
    >
      <div>
        <h2>Upload a workspace file</h2>
        <p>Its visibility follows the selected company assignment.</p>
      </div>
      <label className="field">
        <span>File</span>
        <input
          ref={input}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.md"
          onChange={(event) => setFile(event.target.files?.[0])}
          required
        />
      </label>
      <label className="field">
        <span>Visibility</span>
        <select
          value={scope}
          onChange={(event) =>
            setScope(event.target.value as WorkspaceFileScope)
          }
        >
          {scopes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <div className="file-upload-actions">
        <Button type="submit" disabled={upload.isPending || !file}>
          <Upload />
          {upload.isPending ? "Uploading…" : "Upload file"}
        </Button>
        <Button type="button" variant="quiet" onClick={onClose}>
          Cancel
        </Button>
      </div>
      <small>PDF, PNG, JPEG, WebP, TXT, CSV, or Markdown · maximum 10 MB</small>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function availableScopes(user: AuthUser) {
  if (!user.branch) {
    return [{ value: "COMPANY" as const, label: "Company-wide" }];
  }
  const scopes: Array<{ value: WorkspaceFileScope; label: string }> = [
    { value: "BRANCH", label: user.branch.name },
  ];
  if (user.department) {
    scopes.push({ value: "DEPARTMENT", label: user.department.name });
  }
  return scopes;
}
