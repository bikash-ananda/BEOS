"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Search } from "lucide-react";
import { useDeferredValue, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiFetch, jsonBody } from "@/lib/api";
import type {
  Announcement,
  AnnouncementTarget,
  AuthUser,
  Branch,
  CommunicationPerson,
  Department,
  Page,
} from "@/lib/types";
import { Button, EmptyState, QueryGate } from "../ui";

const dateFormatter = new Intl.DateTimeFormat("en-NP", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AnnouncementsPanel({ user }: { user: AuthUser }) {
  const client = useQueryClient();
  const canManage = user.permissions.includes("announcements.manage");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const announcements = useQuery({
    queryKey: ["communication", "announcements", deferredSearch],
    queryFn: () => {
      const query = new URLSearchParams({ limit: "25" });
      if (deferredSearch) query.set("search", deferredSearch);
      return apiFetch<Page<Announcement>>(`/communication/announcements?${query}`);
    },
  });
  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/communication/announcements/${id}/read`, { method: "POST" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["communication"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/communication/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["communication"] }),
  });
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["communication"] }),
      client.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
  };

  return (
    <section className="announcement-register" aria-labelledby="announcements-heading">
      <header>
        <div>
          <h2 id="announcements-heading">Announcements</h2>
          <span>{announcements.data?.total ?? 0} records</span>
        </div>
        {canManage && (
          <Button onClick={() => setComposing((value) => !value)}>
            <Megaphone /> {composing ? "Close" : "Publish announcement"}
          </Button>
        )}
      </header>
      {composing && (
        <AnnouncementForm
          user={user}
          onCancel={() => setComposing(false)}
          onSaved={async () => {
            setComposing(false);
            await refresh();
          }}
        />
      )}
      {editing && (
        <AnnouncementForm
          user={user}
          announcement={editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
      <label className="communication-search">
        <Search />
        <span className="sr-only">Search announcements</span>
        <input
          value={search}
          maxLength={120}
          placeholder="Search announcements"
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <QueryGate queries={[announcements]} label="Announcements">
        {announcements.data?.items.length ? (
          <div className="announcement-list">
            {announcements.data.items.map((announcement) => (
              <article
                key={announcement.id}
                className={announcement.readAt ? "" : "announcement-unread"}
              >
                <header>
                  <div>
                    <h3>{announcement.title}</h3>
                    <p>
                      {announcement.author.fullName} · {" "}
                      {dateFormatter.format(new Date(announcement.createdAt))}
                      {announcement.editedAt ? " · Edited" : ""}
                    </p>
                  </div>
                  <span>{audienceName(announcement)}</span>
                </header>
                <p className="record-body">{announcement.body}</p>
                <footer>
                  {!announcement.readAt && (
                    <Button
                      variant="secondary"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate(announcement.id)}
                    >
                      Mark read
                    </Button>
                  )}
                  {canManage && (
                    <div className="record-actions">
                      <Button variant="quiet" onClick={() => setEditing(announcement)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(announcement.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No announcements">
            Published announcements for your scope will appear here.
          </EmptyState>
        )}
      </QueryGate>
    </section>
  );
}

function AnnouncementForm({
  user,
  announcement,
  onCancel,
  onSaved,
}: {
  user: AuthUser;
  announcement?: Announcement;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [target, setTarget] = useState<AnnouncementTarget>(
    user.department ? "DEPARTMENT" : user.branch ? "BRANCH" : "COMPANY",
  );
  const [branchId, setBranchId] = useState(user.branch?.id ?? "");
  const [departmentId, setDepartmentId] = useState(user.department?.id ?? "");
  const [userIds, setUserIds] = useState<string[]>([]);
  const people = useQuery({
    queryKey: ["communication", "people", "announcement-form"],
    queryFn: () => apiFetch<Page<CommunicationPerson>>("/communication/people?limit=100"),
    enabled: !announcement && target === "USERS",
  });
  const branches = useQuery({
    queryKey: ["organization", "branches"],
    queryFn: () => apiFetch<Branch[]>("/identity/branches"),
    enabled: !announcement && !user.branch && target === "BRANCH",
  });
  const departments = useQuery({
    queryKey: ["organization", "departments"],
    queryFn: () => apiFetch<Department[]>("/identity/departments"),
    enabled: !announcement && !user.branch && target === "DEPARTMENT",
  });
  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/communication/announcements${announcement ? `/${announcement.id}` : ""}`, {
        method: announcement ? "PATCH" : "POST",
        ...jsonBody(
          announcement
            ? { title: title.trim(), body: body.trim() }
            : {
                title: title.trim(),
                body: body.trim(),
                target,
                ...(target === "BRANCH" && { branchId }),
                ...(target === "DEPARTMENT" && { departmentId }),
                ...(target === "USERS" && { userIds }),
              },
        ),
      }),
    onSuccess: onSaved,
    onError: (error: Error) => toast.error(error.message),
  });
  const validAudience =
    announcement ||
    target === "COMPANY" ||
    (target === "BRANCH" && Boolean(branchId)) ||
    (target === "DEPARTMENT" && Boolean(departmentId)) ||
    (target === "USERS" && userIds.length > 0);

  return (
    <form
      className="record-composer announcement-form"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <label>
        <span>Title</span>
        <input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} />
      </label>
      {!announcement && (
        <label>
          <span>Audience</span>
          <select value={target} onChange={(event) => setTarget(event.target.value as AnnouncementTarget)}>
            {!user.branch && <option value="COMPANY">Company</option>}
            {(!user.branch || user.branch) && <option value="BRANCH">Branch</option>}
            {(!user.branch || user.department) && <option value="DEPARTMENT">Department</option>}
            <option value="USERS">Selected people</option>
          </select>
        </label>
      )}
      {!announcement && target === "BRANCH" && !user.branch && (
        <label>
          <span>Branch</span>
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            <option value="">Choose a branch</option>
            {branches.data?.filter((branch) => branch.isActive).map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </label>
      )}
      {!announcement && target === "DEPARTMENT" && !user.department && (
        <label>
          <span>Department</span>
          <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
            <option value="">Choose a department</option>
            {departments.data?.filter((department) => department.isActive).map((department) => (
              <option key={department.id} value={department.id}>
                {department.name} — {department.branch.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!announcement && target === "USERS" && (
        <fieldset className="people-selector">
          <legend>Recipients</legend>
          <QueryGate queries={[people]} label="People">
            {people.data?.items.map((person) => (
              <label key={person.id}>
                <input
                  type="checkbox"
                  checked={userIds.includes(person.id)}
                  onChange={() =>
                    setUserIds((current) =>
                      current.includes(person.id)
                        ? current.filter((id) => id !== person.id)
                        : [...current, person.id],
                    )
                  }
                />
                <span><strong>{person.fullName}</strong><small>{person.department?.name ?? person.branch?.name ?? "Company-wide"}</small></span>
              </label>
            ))}
          </QueryGate>
        </fieldset>
      )}
      <label>
        <span>Announcement</span>
        <textarea value={body} maxLength={10000} rows={6} onChange={(event) => setBody(event.target.value)} />
      </label>
      <div className="record-actions">
        <Button disabled={title.trim().length < 3 || !body.trim() || !validAudience || save.isPending}>
          {save.isPending ? "Saving…" : announcement ? "Save changes" : "Publish"}
        </Button>
        <Button type="button" variant="quiet" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function audienceName(announcement: Announcement) {
  if (announcement.target === "BRANCH") return announcement.branch?.name ?? "Branch";
  if (announcement.target === "DEPARTMENT") return announcement.department?.name ?? "Department";
  if (announcement.target === "USERS") return `${announcement._count.recipients} selected`;
  return "Company-wide";
}
