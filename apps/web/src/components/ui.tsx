import { AlertTriangle, LoaderCircle, ShieldX } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "quiet";
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props} />
  );
}

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input aria-invalid={Boolean(error)} {...props} />
      {error && <small role="alert">{error}</small>}
    </label>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

interface QueryStatus {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => unknown;
}

export function QueryGate({
  queries,
  label,
  children,
}: {
  queries: QueryStatus[];
  label: string;
  children: ReactNode;
}) {
  const failed = queries.find((query) => query.isError);
  if (failed) {
    return (
      <div className="query-state query-error" role="alert">
        <AlertTriangle />
        <div>
          <h3>{label} could not be loaded</h3>
          <p>
            {failed.error?.message ?? "Check your connection and try again."}
          </p>
          <Button variant="secondary" onClick={() => void failed.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
  if (queries.some((query) => query.isPending)) {
    return (
      <div
        className="query-state query-loading"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle />
        <span>Loading {label.toLowerCase()}…</span>
      </div>
    );
  }
  return children;
}

export function PermissionState({ children }: { children: ReactNode }) {
  return (
    <section className="query-state permission-state">
      <ShieldX />
      <div>
        <h2>Administration access required</h2>
        <p>{children}</p>
      </div>
    </section>
  );
}

export function Status({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`status ${active ? "status-active" : "status-muted"}`}>
      {children}
    </span>
  );
}
