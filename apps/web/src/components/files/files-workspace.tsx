"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Search, Upload } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Page, WorkspaceFile, WorkspaceFileScope } from "@/lib/types";
import { useSession } from "../session-boundary";
import { Button, EmptyState, PermissionState, QueryGate } from "../ui";
import { FileUploadForm } from "./file-upload-form";

const dateFormatter = new Intl.DateTimeFormat("en-NP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function FilesWorkspace() {
  const user = useSession();
  const canRead = user.permissions.includes("files.read");
  const canUpload = user.permissions.includes("files.upload");
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [scope, setScope] = useState<WorkspaceFileScope | "">("");
  const [page, setPage] = useState(1);
  const files = useQuery({
    queryKey: ["workspace-files", deferredSearch, scope, page],
    queryFn: () => {
      const query = new URLSearchParams({ page: String(page), limit: "25" });
      if (deferredSearch) query.set("search", deferredSearch);
      if (scope) query.set("scope", scope);
      return apiFetch<Page<WorkspaceFile>>(`/workspace/files?${query}`);
    },
    enabled: canRead,
  });

  if (!canRead) {
    return (
      <main className="workspace-page">
        <PermissionState>
          Your role does not include workspace file access.
        </PermissionState>
      </main>
    );
  }

  const pageCount = Math.max(1, Math.ceil((files.data?.total ?? 0) / 25));
  return (
    <main className="workspace-page files-page">
      <header className="page-heading files-heading">
        <div>
          <h1>Workspace files</h1>
          <p>
            Store and retrieve documents within your company, branch, or
            department access.
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setShowUpload((value) => !value)}>
            <Upload />
            {showUpload ? "Close upload" : "Upload file"}
          </Button>
        )}
      </header>
      {showUpload && (
        <FileUploadForm user={user} onClose={() => setShowUpload(false)} />
      )}
      <section
        className="file-register"
        aria-labelledby="file-register-heading"
      >
        <header>
          <h2 id="file-register-heading">Files</h2>
          <span>{files.data?.total ?? 0} records</span>
        </header>
        <div className="file-command-band">
          <label className="file-search">
            <Search />
            <span className="sr-only">Search files</span>
            <input
              value={search}
              maxLength={120}
              placeholder="Search files by name"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            <span className="sr-only">Filter by scope</span>
            <select
              value={scope}
              onChange={(event) => {
                setScope(event.target.value as WorkspaceFileScope | "");
                setPage(1);
              }}
            >
              <option value="">All visible scopes</option>
              <option value="COMPANY">Company</option>
              {user.branch && <option value="BRANCH">Branch</option>}
              {user.department && (
                <option value="DEPARTMENT">Department</option>
              )}
            </select>
          </label>
        </div>
        <QueryGate queries={[files]} label="Files">
          <div className="file-table-wrap">
            <table className="file-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Scope</th>
                  <th>Owner</th>
                  <th>Added</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {files.data?.items.length ? (
                  files.data.items.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <strong>{file.originalName}</strong>
                        <small>{formatBytes(file.sizeBytes)}</small>
                      </td>
                      <td>{scopeName(file)}</td>
                      <td>{file.uploadedBy.fullName}</td>
                      <td>{dateFormatter.format(new Date(file.createdAt))}</td>
                      <td>
                        <a
                          className="file-download"
                          href={`/api/v1/workspace/files/${file.id}/download`}
                        >
                          <Download /> Download
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title="No files in this scope">
                        {canUpload
                          ? "Upload the first file when a real company document is ready."
                          : "Files shared with your scope will appear here."}
                      </EmptyState>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <nav className="pagination" aria-label="File pages">
              <Button
                variant="quiet"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {pageCount}
              </span>
              <Button
                variant="quiet"
                disabled={page === pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </QueryGate>
      </section>
    </main>
  );
}

function scopeName(file: WorkspaceFile) {
  const attachment = file.workspaceAttachments[0];
  if (attachment.scope === "DEPARTMENT")
    return attachment.department?.name ?? "Department";
  if (attachment.scope === "BRANCH") return attachment.branch?.name ?? "Branch";
  return "Company-wide";
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1_048_576) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1_048_576).toFixed(1)} MB`;
}
