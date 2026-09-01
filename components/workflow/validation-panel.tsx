"use client";

import type { ValidationIssue, ValidationResult } from "@/domain";

type ValidationPanelProps = {
  result: ValidationResult;
  onSelectNode: (nodeId: string) => void;
};

export function ValidationPanel({ result, onSelectNode }: ValidationPanelProps) {
  const nodeIssues = result.issues.filter((issue) => issue.nodeId);
  const graphIssues = result.issues.filter((issue) => !issue.nodeId);

  return (
    <section aria-label="Workflow validation" className="border-b border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Validation</p>
          <p className="text-xs text-slate-500">
            {result.valid ? "Workflow is valid." : `${result.issues.length} issue${result.issues.length === 1 ? "" : "s"} must be fixed before publishing.`}
          </p>
        </div>
        <span
          aria-label={result.valid ? "Validation passed" : "Validation failed"}
          className={`rounded-full px-2 py-1 text-xs font-semibold ${result.valid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          {result.valid ? "Valid" : "Blocked"}
        </span>
      </div>

      {!result.valid ? (
        <div className="mt-3 space-y-2">
          {nodeIssues.map((issue) => (
            <ValidationIssueRow key={issue.id} issue={issue} onSelectNode={onSelectNode} />
          ))}
          {graphIssues.map((issue) => (
            <ValidationIssueRow key={issue.id} issue={issue} onSelectNode={onSelectNode} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ValidationIssueRow({ issue, onSelectNode }: { issue: ValidationIssue; onSelectNode: (nodeId: string) => void }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50/60 p-3 text-xs">
      <div className="font-medium text-red-900">{issue.message}</div>
      <div className="mt-1 text-red-700">{issue.code.replaceAll("_", " ")}</div>
      {issue.nodeId ? (
        <button
          type="button"
          onClick={() => onSelectNode(issue.nodeId as string)}
          className="mt-2 rounded-md border border-red-200 bg-white px-2 py-1 font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Select affected node
        </button>
      ) : (
        <span className="mt-2 block text-red-700">Workflow-level issue</span>
      )}
    </div>
  );
}
