"use client";

import { Background, Controls, ReactFlow, ReactFlowProvider, useReactFlow, type Connection, type NodeChange, type OnNodesDelete } from "@xyflow/react";
import { useRef, useState } from "react";
import type { NodeConfig, NodeType, Workflow } from "@/domain";
import { addEdge, addNode, deleteNodes, moveNode, updateNodeConfig } from "@/domain";
import { toDomainEdge, toReactFlow, type CanvasNode } from "@/lib/workflow/react-flow-adapter";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";
import { ActionNode, ConditionNode, EndNode, NotificationNode, TriggerNode } from "./workflow-nodes";
import { NodeConfigurationPanel } from "./node-configuration-panel";

const nodeTypes = { trigger: TriggerNode, action: ActionNode, condition: ConditionNode, notification: NotificationNode, end: EndNode };
const palette: Array<{ type: NodeType; label: string }> = [
  { type: "trigger", label: "Trigger" }, { type: "action", label: "Action" }, { type: "condition", label: "Condition" }, { type: "notification", label: "Notification" }, { type: "end", label: "End" },
];

function CanvasEditor() {
  const [workflow, setWorkflow] = useState<Workflow>(() => structuredClone(sampleWorkflow));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState("Canvas ready. Select a node or connect ports.");
  const idCounter = useRef(0);
  const { screenToFlowPosition } = useReactFlow();
  const { nodes, edges } = toReactFlow(workflow);
  const selectedNode = workflow.nodes.find((node) => node.id === selectedNodeId);

  const onNodesChange = (changes: NodeChange<CanvasNode>[]) => { let next = workflow; for (const change of changes) if (change.type === "position" && change.position) next = moveNode(next, change.id, change.position); if (next !== workflow) setWorkflow(next); };
  const onConnect = (connection: Connection) => { const domainEdge = toDomainEdge({ ...connection, id: `edge-${connection.source}-${connection.sourceHandle ?? "default"}-${connection.target}` }); if (!domainEdge) return setMessage("Connection rejected: ports do not match the workflow model."); const next = addEdge(workflow, domainEdge); if (!next) return setMessage("Connection rejected by the workflow domain rules."); setWorkflow(next); setMessage("Connection added."); };
  const onNodesDelete: OnNodesDelete = (deleted) => { const ids = deleted.map((node) => node.id); setWorkflow((current) => deleteNodes(current, ids)); if (selectedNodeId && ids.includes(selectedNodeId)) setSelectedNodeId(null); setMessage(`${ids.length} node${ids.length === 1 ? "" : "s"} deleted.`); };
  const addPaletteNode = (type: NodeType) => { const id = `${type}-${++idCounter.current}`; const position = screenToFlowPosition({ x: window.innerWidth / 2, y: 280 }); const next = addNode(workflow, type, id, position); if (!next) return; setWorkflow(next); setSelectedNodeId(id); setMessage(`${type[0].toUpperCase()}${type.slice(1)} node added.`); };
  const deleteSelected = () => { if (!selectedNodeId) return; setWorkflow((current) => deleteNodes(current, [selectedNodeId])); setSelectedNodeId(null); setMessage("1 node deleted."); };
  const applyConfig = (nodeId: string, config: NodeConfig): boolean => { const next = updateNodeConfig(workflow, nodeId, config); if (!next) { setMessage("Configuration rejected by the workflow domain."); return false; } setWorkflow(next); setMessage("Node configuration updated."); return true; };

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-950">{workflow.name}</p><p className="text-xs text-slate-500">Canvas-only draft · no persistence</p></div><div className="flex flex-wrap gap-2" aria-label="Node palette">{palette.map(({ type, label }) => <button key={type} type="button" onClick={() => addPaletteNode(type)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">+ {label}</button>)}</div></div>
    <div className="grid min-h-[620px] lg:grid-cols-[minmax(0,1fr)_280px]"><section className="relative min-h-[620px]" aria-label="Workflow canvas"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onNodesDelete={onNodesDelete} onConnect={onConnect} onNodeClick={(_, node) => { setSelectedNodeId(node.id); setMessage(`${node.data.title} selected.`); }} onPaneClick={() => setSelectedNodeId(null)} deleteKeyCode={["Backspace", "Delete"]} fitView fitViewOptions={{ padding: 0.25, maxZoom: 1.15 }} proOptions={{ hideAttribution: true }} className="bg-slate-50"><Background gap={24} size={1} /><Controls showInteractive={false} position="bottom-left" aria-label="Canvas controls" /></ReactFlow></section><section aria-label="Properties panel" className="min-w-0"><NodeConfigurationPanel node={selectedNode} onApply={applyConfig} /><div className="border-t border-slate-200 p-4"><div aria-live="polite" className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{message}</div>{selectedNode ? <button type="button" onClick={deleteSelected} className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Delete selected</button> : null}</div></section></div>
    <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">Configuration changes apply to the in-memory domain workflow only; nothing is persisted.</p>
  </div>;
}

export function WorkflowCanvas() { return <ReactFlowProvider><CanvasEditor /></ReactFlowProvider>; }
