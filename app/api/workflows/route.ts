import { NextResponse } from "next/server";
import { workflowRepository } from "@/features/workflow-persistence/repository";
import type { Workflow } from "@/domain";

export async function GET() {
  try {
    return NextResponse.json({ workflows: await workflowRepository.list() });
  } catch {
    return NextResponse.json({ error: { code: "PERSISTENCE_ERROR", message: "Unable to load workflows." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workflow = (await request.json()) as Workflow;
    const created = await workflowRepository.create(workflow);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INVALID_WORKFLOW", message: error instanceof Error ? error.message : "Invalid workflow." } },
      { status: 400 },
    );
  }
}
