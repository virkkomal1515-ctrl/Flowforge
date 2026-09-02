import { NextResponse } from "next/server";
import { executeWorkflow } from "@/domain/workflow/execution";
import { workflowRepository, WorkflowNotFoundError, WorkflowNotPublishedError } from "@/features/workflow-persistence/repository";

interface RouteContext { params: Promise<{ workflowId: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const { workflowId } = await params;
  try {
    const body = await request.json().catch(() => ({})) as { input?: Record<string, string | number | boolean | null>; failNodeId?: string; executionId?: string; now?: string };
    const workflow = await workflowRepository.getPublished(workflowId);
    return NextResponse.json(executeWorkflow(workflow, body.input ?? {}, { failNodeId: body.failNodeId, executionId: body.executionId, now: body.now }));
  } catch (error) {
    if (error instanceof WorkflowNotFoundError) return NextResponse.json({ error: { code: "NOT_FOUND", message: error.message } }, { status: 404 });
    if (error instanceof WorkflowNotPublishedError) return NextResponse.json({ error: { code: "NOT_PUBLISHED", message: error.message } }, { status: 409 });
    return NextResponse.json({ error: { code: "EXECUTION_FAILED", message: "Unable to execute workflow." } }, { status: 500 });
  }
}
