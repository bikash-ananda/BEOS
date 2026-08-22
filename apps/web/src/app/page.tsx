export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-900">
      <p className="text-sm tracking-wide text-zinc-500">
        Bikash Engineering Pvt. Ltd. · Pokhara, Nepal
      </p>
      <h1 className="mt-3 text-center text-4xl font-semibold tracking-tight">
        BEOS
      </h1>
      <p className="mt-2 text-center text-lg text-zinc-600">
        Bikash Engineering Operating System
      </p>
      <p className="mt-8 max-w-md text-center text-sm text-zinc-500">
        Wave 0 foundation. Company Workspace, login, and collaboration features
        come in later waves. API health:{" "}
        <a className="underline" href="http://localhost:3001/health">
          http://localhost:3001/health
        </a>
      </p>
    </main>
  );
}
