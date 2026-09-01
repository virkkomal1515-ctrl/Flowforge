"use client";

import { Background, Controls, ReactFlow, ReactFlowProvider, useReactFlow, type Connection, type NodeChange, type OnNodesDelete } from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { validateWorkflow, type NodeConfig, type NodeType, type Workflow } from "@/domain";
import { addEdge, addNode, deleteNodes, moveNode, updateNodeConfig } from "@/domain";
import { toDomainEdge, toReactFlow, type CanvasNode } from "@/lib/workflow/react-flow-adapter";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";
import { ActionNode, ConditionNode, EndNode, NotificationNode, TriggerNode } from "./workflow-nodes";
import { NodeConfigurationPanel } from "./node-configuration-panel";
import { ValidationPanel } from "./validation-panel";

const nodeTypes = { trigger: TriggerNode, action: ActionNode, condition: ConditionNode, notification: NotificationNode, end: EndNode };
const palette: Array<{ type: NodeType; label: string }> = [
  { type: "trigger", label: "Trigger" }, { type: "action", label: "Action" }, { type: "condition", label: "Condition" }, { type: "notification", label: "Notification" }, { type: "end", label: "End" },
];

type SaveState = "idle" | "loading" | "saving" | "saved" | "error";

function CanvasEditor({ workflowId }: { workflowId?: string }) {
  const [workflow, setWorkflow] = useState<Workflow>(() => structuredClone(sampleWorkflow));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState("Canvas ready. Select a node or connect ports.");
  const [saveState, setSaveState] = useState<SaveState>(workflowId ? "loading" : "idle");
  const [persisted, setPersisted] = useState(!workflowId);
  const idCounter = useRef(0);
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const validation = useMemo(() => validateWorkflow(workflow), [workflow]);
  const { nodes, edges } = useMemo(() => toReactFlow(workflow, validation.issues), [workflow, validation.issues]);
  const selectedNode = workflow.nodes.find((node) => node.id === selectedNodeId);

  useEffect(() => {
    if (!workflowId) return;
    let active = true;
    fetch(`/api/workflows/${encodeURIComponent(workflowId)}`)
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Unable to load workflow.");
        return (await response.json()) as Workflow;
      })
      .then((loaded) => {
        if (!active) return;
        if (loaded) { setWorkflow(loaded); setPersisted(true); setMessage("Workflow loaded."); setSaveState("saved"); }
        else { setWorkflow({ ...structuredClone(sampleWorkflow), id: workflowId }); setPersisted(false); setMessage("New workflow draft ready. Save to persist it."); setSaveState("idle"); }
      })
      .catch(() => { if (active) { setSaveState("error"); setMessage("Unable to load workflow. Local edits are preserved."); } });
    return () => { active = false; };
  }, [workflowId]);

  const selectAndFocusNode = (nodeId: string) => {
    const node = workflow.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;
    setSelectedNodeId(nodeId);
    setCenter(node.position.x + 104, node.position.y + 48, { zoom: 1.1, duration: 300 });
    setMessage(`${node.type[0].toUpperCase()}${node.type.slice(1)} node selected from validation.`);
  };

  const onNodesChange = (changes: NodeChange<CanvasNode>[]) => { let next = workflow; for (const change of changes) if (change.type === "position" && change.position) next = moveNode(next, change.id, change.position); if (next !== workflow) { setWorkflow(next); setSaveState("idle"); } };
  const onConnect = (connection: Connection) => { const domainEdge = toDomainEdge({ ...connection, id: `edge-${connection.source}-${connection.sourceHandle ?? "default"}-${connection.target}` }); if (!domainEdge) return setMessage("Connection rejected: ports do not match the workflow model."); const next = addEdge(workflow, domainEdge); if (!next) return setMessage("Connection rejected by the workflow domain rules."); setWorkflow(next); setSaveState("idle"); setMessage("Connection added."); };
  const onNodesDelete: OnNodesDelete = (deleted) => { const ids = deleted.map((node) => node.id); setWorkflow((current) => deleteNodes(current, ids)); setSaveState("idle"); if (selectedNodeId && ids.includes(selectedNodeId)) setSelectedNodeId(null); setMessage(`${ids.length} node${ids.length === 1 ? "" : "s"} deleted.`); };
  const addPaletteNode = (type: NodeType) => { const id = `${type}-${++idCounter.current}`; const position = screenToFlowPosition({ x: window.innerWidth / 2, y: 280 }); const next = addNode(workflow, type, id, position); if (!next) return; setWorkflow(next); setSelectedNodeId(id); setSaveState("idle"); setMessage(`${type[0].toUpperCase()}${type.slice(1)} node added.`); };
  const deleteSelected = () => { if (!selectedNodeId) return; setWorkflow((current) => deleteNodes(current, [selectedNodeId])); setSelectedNodeId(null); setSaveState("idle"); setMessage("1 node deleted."); };
  const applyConfig = (nodeId: string, config: NodeConfig): boolean => { const next = updateNodeConfig(workflow, nodeId, config); if (!next) { setMessage("Configuration rejected by the workflow domain."); return false; } setWorkflow(next); setSaveState("idle"); setMessage("Node configuration updated."); return true; };

  const saveWorkflow = async () => {
    setSaveState("saving");
    try {
      const response = persisted
        ? await fetch(`/api/workflows/${encodeURIComponent(workflow.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow, expectedRevision: workflow.version }) })
        : await fetch("/api/workflows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workflow) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "Unable to save workflow.");
      setWorkflow(body as Workflow); setPersisted(true); setSaveState("saved"); setMessage("Workflow saved.");
    } catch (error) { setSaveState("error"); setMessage(error instanceof Error ? error.message : "Unable to save workflow."); }
  };

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <ValidationPanel result={validation} onSelectNode={selectAndFocusNode} />
    <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-950">{workflow.name}</p><p className="text-xs text-slate-500">{saveState === "loading" ? "Loading workflow…" : saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Persistence error" : "Unsaved changes"}</p></div><div className="flex flex-wrap gap-2" aria-label="Node palette"><button type="button" onClick={saveWorkflow} disabled={saveState === "loading" || saveState === "saving"} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Save</button>{palette.map(({ type, label }) => <button key={type} type="button" onClick={() => addPaletteNode(type)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">+ {label}</button>)}</div></div>
    <div className="grid min-h-[620px] lg:grid-cols-[minmax(0,1fr)_280px]"><section className="relative min-h-[620px]" aria-label="Workflow canvas"><ReactFlow nodes={nodes.map((node) => ({ ...node, selected: node.id === selectedNodeId }))} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onNodesDelete={onNodesDelete} onConnect={onConnect} onNodeClick={(_, node) => { setSelectedNodeId(node.id); setMessage(`${node.data.title} selected.`); }} onPaneClick={() => setSelectedNodeId(null)} deleteKeyCode={["Backspace", "Delete"]} fitView fitViewOptions={{ padding: 0.25, maxZoom: 1.15 }} proOptions={{ hideAttribution: true }} className="bg-slate-50"><Background gap={24} size={1} /><Controls showInteractive={false} position="bottom-left" aria-label="Canvas controls" /></ReactFlow></section><section aria-label="Properties panel" className="min-w-0"><NodeConfigurationPanel node={selectedNode} onApply={applyConfig} /><div className="border-t border-slate-200 p-4"><div aria-live="polite" className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{message}</div>{selectedNode ? <button type="button" onClick={deleteSelected} className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Delete selected</button> : null}</div></section></div>
    <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">Workflow data is persisted through the domain persistence API; validation is derived from the current workflow and is not persisted.</p>
  </div>;
}

export function WorkflowCanvas({ workflowId }: { workflowId?: string }) { return <ReactFlowProvider><CanvasEditor workflowId={workflowId} /></ReactFlowProvider>; }
