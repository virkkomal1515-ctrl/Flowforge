import { NextResponse } from "next/server";
import { validateForPublish, type Workflow } from "@/domain";
import { workflowRepository, WorkflowNotFoundError, WorkflowRevisionConflictError } from "@/features/workflow-persistence/repository";

interface RouteContext { params: Promise<{ workflowId: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const { workflowId } = await params;
  try {
    const body = await request.json() as { workflow?: unknown; expectedRevision?: unknown };
    if (typeof body.expectedRevision !== "number" || !Number.isInteger(body.expectedRevision) || body.expectedRevision < 0) return NextResponse.json({ error: { code: "INVALID_REVISION", message: "A non-negative integer expectedRevision is required." } }, { status: 400 });
    const workflow = body.workflow as Workflow;
    if (!workflow || typeof workflow !== "object" || workflow.id !== workflowId) return NextResponse.json({ error: { code: "WORKFLOW_ID_MISMATCH", message: "Workflow id does not match the route." } }, { status: 400 });
    const validation = validateForPublish(workflow);
    if (!validation.valid) return NextResponse.json({ error: { code: "PUBLISH_VALIDATION_FAILED", message: "Workflow cannot be published until all validation errors are resolved.", issues: validation.issues } }, { status: 422 });
    return NextResponse.json(await workflowRepository.publish(workflow, body.expectedRevision));
  } catch (error) {
    if (error instanceof WorkflowNotFoundError) return NextResponse.json({ error: { code: "NOT_FOUND", message: error.message } }, { status: 404 });
    if (error instanceof WorkflowRevisionConflictError) return NextResponse.json({ error: { code: "REVISION_CONFLICT", message: error.message } }, { status: 409 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body is invalid JSON." } }, { status: 400 });
    return NextResponse.json({ error: { code: "PUBLISH_FAILED", message: "Unable to publish workflow." } }, { status: 500 });
  }
}
