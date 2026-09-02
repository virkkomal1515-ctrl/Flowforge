import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { validateForPublish } from "@/domain";
import { workflowRepository, WorkflowNotFoundError, WorkflowRevisionConflictError } from "@/features/workflow-persistence/repository";
import { fromPersistence } from "@/lib/workflow/persistence-transforms";

interface RouteContext { params: Promise<{ workflowId: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const { workflowId } = await params;
  try {
    const body = await request.json() as { workflow?: unknown; expectedRevision?: unknown };
    if (typeof body.expectedRevision !== "number" || !Number.isInteger(body.expectedRevision) || body.expectedRevision < 0) return NextResponse.json({ error: { code: "INVALID_REVISION", message: "A non-negative integer expectedRevision is required." } }, { status: 400 });
    const workflow = fromPersistence(body.workflow);
    if (workflow.id !== workflowId) return NextResponse.json({ error: { code: "WORKFLOW_ID_MISMATCH", message: "Workflow id does not match the route." } }, { status: 400 });
    const validation = validateForPublish(workflow);
    if (!validation.valid) return NextResponse.json({ error: { code: "PUBLISH_VALIDATION_FAILED", message: "Workflow cannot be published until all validation errors are resolved.", issues: validation.issues } }, { status: 422 });
    return NextResponse.json(await workflowRepository.publish(workflow, body.expectedRevision));
  } catch (error) {
    if (error instanceof WorkflowNotFoundError) return NextResponse.json({ error: { code: "NOT_FOUND", message: error.message } }, { status: 404 });
    if (error instanceof WorkflowRevisionConflictError) return NextResponse.json({ error: { code: "REVISION_CONFLICT", message: error.message } }, { status: 409 });
    if (error instanceof ZodError) return NextResponse.json({ error: { code: "INVALID_WORKFLOW", message: "Workflow payload is invalid." } }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body is invalid JSON." } }, { status: 400 });
    return NextResponse.json({ error: { code: "PUBLISH_FAILED", message: "Unable to publish workflow." } }, { status: 500 });
  }
}
