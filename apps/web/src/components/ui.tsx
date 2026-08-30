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
      <span>00</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
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
