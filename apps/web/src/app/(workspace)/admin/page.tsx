import { AdminConsole } from "@/components/admin/admin-console";

export default function AdminPage() {
  return (
    <main className="workspace-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Identity administration</p>
          <h1>Company access, with accountability.</h1>
          <p>
            Manage the people and organizational structure that every BEOS
            module will rely on.
          </p>
        </div>
        <span className="heading-index">
          03
          <br />
          <small>CONTROL</small>
        </span>
      </section>
      <AdminConsole />
    </main>
  );
}
