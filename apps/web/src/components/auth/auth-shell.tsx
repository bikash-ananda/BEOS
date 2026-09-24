import { Building2, CircuitBoard } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div className="brand-lockup">
          <span className="brand-mark">BE</span>
          <span>
            <strong>BEOS</strong>
            <small>Bikash Engineering</small>
          </span>
        </div>
        <div className="auth-story-copy">
          <h2>
            One accountable workspace for the work that moves engineering
            forward.
          </h2>
          <p>
            People, access, and company structure now begin with verified
            operational records.
          </p>
        </div>
        <div className="auth-blueprint" aria-hidden="true">
          <CircuitBoard />
          <Building2 />
          <span>PKR — NPL</span>
        </div>
      </section>
      <section className="auth-form-area">
        <div className="auth-form-card">
          <h1>{title}</h1>
          <p className="form-intro">{intro}</p>
          {children}
        </div>
        <p className="auth-footnote">BEOS · Authorized company access only</p>
      </section>
    </main>
  );
}
