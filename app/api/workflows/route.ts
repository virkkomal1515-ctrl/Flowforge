import { NextResponse } from "next/server";
import { fromPersistence } from "@/lib/workflow/persistence-transforms";
import { workflowRepository } from "@/features/workflow-persistence/repository";

export async function GET() {
  try {
    return NextResponse.json({ workflows: await workflowRepository.list() });
  } catch {
    return NextResponse.json({ error: { code: "PERSISTENCE_ERROR", message: "Unable to load workflows." } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workflow = fromPersistence(await request.json());
    const created = await workflowRepository.create(workflow);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INVALID_WORKFLOW", message: error instanceof Error ? error.message : "Invalid workflow." } },
      { status: 400 },
    );
  }
}
