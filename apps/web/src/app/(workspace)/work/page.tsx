import { WorkWorkspace } from "@/components/work/work-workspace";

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string; task?: string }>;
}) {
  const params = await searchParams;
  const initialFocus = params.meeting
    ? { type: "meeting" as const, id: params.meeting }
    : params.task
      ? { type: "task" as const, id: params.task }
      : null;
  return <WorkWorkspace initialFocus={initialFocus} />;
}
