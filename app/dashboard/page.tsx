import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="space-y-4">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your workflows</h1>
        <p className="max-w-xl text-slate-600">FlowForge foundation is ready. Workflow creation and editing will arrive in later milestones.</p>
        <Link href="/workflows/demo" className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Open workflow editor</Link>
      </section>
    </AppShell>
  );
}
