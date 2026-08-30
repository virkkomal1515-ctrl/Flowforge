"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { NodeConfig, WorkflowNode } from "@/domain";
import { validateNodeConfigInput, nodeConfigSchemas } from "@/domain/workflow/forms";
import type { z } from "zod";

type FormValues = Record<string, string>;

type Props = {
  node: WorkflowNode | undefined;
  onApply: (nodeId: string, config: NodeConfig) => void;
  onCancel?: () => void;
};

const labels: Record<WorkflowNode["type"], string> = {
  trigger: "Trigger",
  action: "Action",
  condition: "Condition",
  notification: "Notification",
  end: "End",
};

const fields: Record<WorkflowNode["type"], Array<{ name: string; label: string; required?: boolean; type?: string }>> = {
  trigger: [
    { name: "triggerName", label: "Trigger name", required: true },
    { name: "triggerType", label: "Trigger type", required: true },
  ],
  action: [
    { name: "actionName", label: "Action name", required: true },
    { name: "operation", label: "Operation", required: true },
    { name: "parameter", label: "Parameter" },
  ],
  condition: [
    { name: "field", label: "Field", required: true },
    { name: "operator", label: "Operator", required: true },
    { name: "comparisonValue", label: "Comparison value", required: true },
  ],
  notification: [
    { name: "recipient", label: "Recipient", required: true, type: "email" },
    { name: "message", label: "Message", required: true },
  ],
  end: [{ name: "completionLabel", label: "Completion label" }],
};

function initialValues(node: WorkflowNode): FormValues {
  return Object.fromEntries(Object.entries(node.config).map(([key, value]) => [key, value == null ? "" : String(value)]));
}

function errorMessage(result: ReturnType<typeof nodeConfigSchemas[WorkflowNode["type"]]["safeParse"]>) {
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function NodeConfigurationPanel({ node, onApply, onCancel }: Props) {
  const form = useForm<FormValues>({ defaultValues: node ? initialValues(node) : {}, mode: "onSubmit" });
  const { register, handleSubmit, reset, setError, formState: { errors, isDirty } } = form;

  useEffect(() => {
    reset(node ? initialValues(node) : {});
  }, [node, reset]);

  if (!node) {
    return <aside className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0" aria-label="Node properties"><p className="text-sm font-semibold text-slate-900">Nothing selected</p><p className="mt-1 text-sm text-slate-500">Select a node to edit its configuration.</p></aside>;
  }

  const submit = (values: FormValues) => {
    const parsed = nodeConfigSchemas[node.type].safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") setError(field, { type: "zod", message: issue.message });
      });
      return;
    }
    const config = validateNodeConfigInput(node.type, parsed.data);
    if (!config) {
      setError("root", { type: "domain", message: "This configuration is not valid for the selected node." });
      return;
    }
    onApply(node.id, config);
  };

  return <aside className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0" aria-label="Node properties">
    <div className="mb-5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Selected node</p><h2 className="mt-1 text-base font-semibold capitalize text-slate-950">{labels[node.type]}</h2><p className="mt-1 text-xs text-slate-500">Type: {node.type}</p></div>
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      {fields[node.type].map((field) => {
        const error = errors[field.name]?.message;
        const id = `node-${node.id}-${field.name}`;
        const options = field.name === "operation" ? [["assign", "Assign"], ["update_status", "Update status"], ["create_record", "Create record"]] : field.name === "operator" ? [["equals", "Equals"], ["not_equals", "Not equals"], ["greater_than", "Greater than"], ["less_than", "Less than"]] : field.name === "triggerType" ? [["manual", "Manual"]] : null;
        return <div key={field.name}><label htmlFor={id} className="block text-sm font-medium text-slate-800">{field.label}{field.required ? <span aria-hidden="true"> *</span> : null}</label>{options ? <select id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...register(field.name, { required: field.required })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300">{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : field.name === "message" ? <textarea id={id} rows={4} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...register(field.name, { required: field.required })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300" /> : <input id={id} type={field.type ?? "text"} aria-required={field.required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...register(field.name, { required: field.required })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300" />}{error ? <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-700">{String(error)}</p> : null}</div>;
      })}
      {errors.root?.message ? <p role="alert" className="text-sm text-red-700">{String(errors.root.message)}</p> : null}
      <div className="flex gap-2 pt-2"><button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">Apply changes</button>{isDirty && onCancel ? <button type="button" onClick={() => { reset(initialValues(node)); onCancel(); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">Cancel</button> : null}</div>
    </form>
  </aside>;
}
