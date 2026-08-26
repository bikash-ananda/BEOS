import { AdminConsole } from "@/components/admin/admin-console";

export default function AdminPage() {
  return (
    <main className="workspace-page">
      <section className="page-heading">
        <div>
          <h1>Company access, with accountability.</h1>
          <p>
            Manage the people and organizational structure that every BEOS
            module will rely on.
          </p>
        </div>
      </section>
      <AdminConsole />
    </main>
  );
}
