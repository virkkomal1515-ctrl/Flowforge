"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Background, Controls, ReactFlow, ReactFlowProvider, useReactFlow, type Connection, type NodeChange, type OnNodesDelete } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addEdge, addNode, deleteNodes, moveNode, updateNodeConfig, validateWorkflow, type NodeConfig, type NodeType, type Workflow } from "@/domain";
import { fetchWorkflow, publishWorkflow, updateWorkflow, workflowQueryKeys } from "@/lib/workflow/api";
import { AutosaveController, type SaveStatus } from "@/lib/workflow/autosave";
import { commitWorkflowHistory, createWorkflowHistory, redoWorkflowHistory, undoWorkflowHistory, DEFAULT_HISTORY_LIMIT, type WorkflowHistory } from "@/lib/workflow/history";
import { toDomainEdge, toReactFlow, type CanvasNode } from "@/lib/workflow/react-flow-adapter";
import { sampleWorkflow } from "@/lib/workflow/sample-workflow";
import { canPublish } from "@/lib/workflow/publish-state";
import { ActionNode, ConditionNode, EndNode, NotificationNode, TriggerNode } from "./workflow-nodes";
import { NodeConfigurationPanel } from "./node-configuration-panel";
import { ValidationPanel } from "./validation-panel";
import { ExecutionPreview } from "./execution-preview";

const nodeTypes = { trigger: TriggerNode, action: ActionNode, condition: ConditionNode, notification: NotificationNode, end: EndNode };
const palette: Array<{ type: NodeType; label: string }> = [
  { type: "trigger", label: "Trigger" }, { type: "action", label: "Action" }, { type: "condition", label: "Condition" }, { type: "notification", label: "Notification" }, { type: "end", label: "End" },
];
const SAVE_STATUS_LABELS: Record<SaveStatus, string> = { saved: "Saved", saving: "Saving…", unsaved: "Unsaved changes", retrying: "Retrying…", "save-failed": "Save failed" };

function CanvasEditor({ initialWorkflow, persisted }: { initialWorkflow: Workflow; persisted: boolean }) {
  const [history, setHistory] = useState<WorkflowHistory>(() => createWorkflowHistory(initialWorkflow));
  const [localRevision, setLocalRevision] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState("Canvas ready. Select a node or connect ports.");
  const [publishing, setPublishing] = useState(false);
  const idCounter = useRef(0);
  const localRevisionRef = useRef(0);
  const autosaveRef = useRef<AutosaveController | null>(null);
  const serverRevisionRef = useRef(initialWorkflow.version);
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const queryClient = useQueryClient();
  const workflow = history.present;

  useEffect(() => {
    if (!persisted) return;
    const controller = new AutosaveController({
      initialServerRevision: serverRevisionRef.current,
      save: (snapshot, expectedServerRevision) => updateWorkflow({ ...structuredClone(snapshot), version: expectedServerRevision }),
      getLatestRevision: () => localRevisionRef.current,
      onStatusChange: setSaveStatus,
      onSaved: (request, saved, isLatest) => {
        serverRevisionRef.current = saved.version;
        queryClient.setQueryData(workflowQueryKeys.detail(saved.id), saved);
        queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list() });
        setMessage(isLatest ? "Workflow saved automatically." : `Save for local revision ${request.localRevision} completed; newer changes remain local.`);
      },
      onFailed: (_, error) => setMessage(error instanceof Error ? error.message : "Unable to save workflow."),
    });
    autosaveRef.current = controller;
    return () => { controller.dispose(); autosaveRef.current = null; };
  }, [persisted, queryClient]);

  const commitLocalWorkflow = useCallback((next: Workflow) => {
    setHistory((current) => {
      const nextHistory = commitWorkflowHistory(current, next, DEFAULT_HISTORY_LIMIT);
      if (nextHistory === current) return current;
      localRevisionRef.current += 1;
      setLocalRevision(localRevisionRef.current);
      if (persisted) autosaveRef.current?.schedule({ workflow: nextHistory.present, localRevision: localRevisionRef.current });
      return nextHistory;
    });
  }, [persisted]);

  const publish = async () => {
    if (!publishAllowed || !persisted || publishing) return;
    if (saveStatus !== "saved") { setMessage("Wait for the latest draft to finish saving before publishing."); return; }
    setPublishing(true);
    setMessage("Publishing validated workflow…");
    try {
      const published = await publishWorkflow(workflow);
      serverRevisionRef.current = published.version;
      queryClient.setQueryData(workflowQueryKeys.detail(published.id), published);
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list() });
      setHistory(createWorkflowHistory(published));
      setMessage(`Published version ${published.version} successfully.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to publish workflow."); }
    finally { setPublishing(false); }
  };

  const selectAndFocusNode = (nodeId: string) => { const node = workflow.nodes.find((candidate) => candidate.id === nodeId); if (!node) return; setSelectedNodeId(nodeId); setCenter(node.position.x + 104, node.position.y + 48, { zoom: 1.1, duration: 300 }); setMessage(`${node.type[0].toUpperCase()}${node.type.slice(1)} node selected from validation.`); };
  const onNodesChange = (changes: NodeChange<CanvasNode>[]) => { let next = workflow; for (const change of changes) if (change.type === "position" && change.position) next = moveNode(next, change.id, change.position); if (next !== workflow) commitLocalWorkflow(next); };
  const onConnect = (connection: Connection) => { const domainEdge = toDomainEdge({ ...connection, id: `edge-${connection.source}-${connection.sourceHandle ?? "default"}-${connection.target}` }); if (!domainEdge) return setMessage("Connection rejected: ports do not match the workflow model."); const next = addEdge(workflow, domainEdge); if (!next) return setMessage("Connection rejected by the workflow domain rules."); commitLocalWorkflow(next); setMessage("Connection added."); };
  const onNodesDelete: OnNodesDelete = (deleted) => { const ids = deleted.map((node) => node.id); commitLocalWorkflow(deleteNodes(workflow, ids)); if (selectedNodeId && ids.includes(selectedNodeId)) setSelectedNodeId(null); setMessage(`${ids.length} node${ids.length === 1 ? "" : "s"} deleted.`); };
  const addPaletteNode = (type: NodeType) => { const id = `${type}-${++idCounter.current}`; const position = screenToFlowPosition({ x: window.innerWidth / 2, y: 280 }); const next = addNode(workflow, type, id, position); if (!next) return; commitLocalWorkflow(next); setSelectedNodeId(id); setMessage(`${type[0].toUpperCase()}${type.slice(1)} node added.`); };
  const deleteSelected = () => { if (!selectedNodeId) return; commitLocalWorkflow(deleteNodes(workflow, [selectedNodeId])); setSelectedNodeId(null); setMessage("1 node deleted."); };
  const applyConfig = (nodeId: string, config: NodeConfig): boolean => { const next = updateNodeConfig(workflow, nodeId, config); if (!next) { setMessage("Configuration rejected by the workflow domain."); return false; } commitLocalWorkflow(next); setMessage("Node configuration updated."); return true; };
  const undo = useCallback(() => setHistory((current) => { if (!current.past.length) return current; const next = undoWorkflowHistory(current); localRevisionRef.current += 1; setLocalRevision(localRevisionRef.current); if (persisted) autosaveRef.current?.schedule({ workflow: next.present, localRevision: localRevisionRef.current }); setMessage("Undo applied."); return next; }), [persisted]);
  const redo = useCallback(() => setHistory((current) => { if (!current.future.length) return current; const next = redoWorkflowHistory(current, DEFAULT_HISTORY_LIMIT); localRevisionRef.current += 1; setLocalRevision(localRevisionRef.current); if (persisted) autosaveRef.current?.schedule({ workflow: next.present, localRevision: localRevisionRef.current }); setMessage("Redo applied."); return next; }), [persisted]);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { const modifier = event.metaKey || event.ctrlKey; if (!modifier || event.altKey) return; if (event.key.toLowerCase() === "z" && !event.shiftKey) { event.preventDefault(); undo(); } else if (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey)) { event.preventDefault(); redo(); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [redo, undo]);

  const validation = useMemo(() => validateWorkflow(workflow), [workflow]);
  const publishAllowed = canPublish(workflow);
  const { nodes, edges } = useMemo(() => toReactFlow(workflow, validation.issues), [workflow, validation.issues]);
  const selectedNode = workflow.nodes.find((node) => node.id === selectedNodeId);

  return <div className="space-y-4">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ValidationPanel result={validation} onSelectNode={selectAndFocusNode} />
      <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-950">{workflow.name}</p><p role="status" aria-live="polite" className="text-xs text-slate-500">{SAVE_STATUS_LABELS[saveStatus]}{persisted && localRevision > 0 ? ` · local revision ${localRevision}` : ""}</p></div><div className="flex flex-wrap gap-2" aria-label="Workflow actions"><button type="button" onClick={undo} disabled={!history.past.length} aria-label="Undo last workflow change" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Undo</button><button type="button" onClick={redo} disabled={!history.future.length} aria-label="Redo last workflow change" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Redo</button><button type="button" disabled={!publishAllowed || !persisted || publishing} aria-disabled={!publishAllowed || !persisted || publishing} onClick={publish} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">{publishing ? "Publishing…" : workflow.status === "published" ? "Republish" : "Publish"}</button>{palette.map(({ type, label }) => <button key={type} type="button" onClick={() => addPaletteNode(type)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">+ {label}</button>)}</div></div>
      <div className="grid min-h-[620px] lg:grid-cols-[minmax(0,1fr)_280px]"><section className="relative min-h-[620px]" aria-label="Workflow canvas"><ReactFlow nodes={nodes.map((node) => ({ ...node, selected: node.id === selectedNodeId }))} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onNodesDelete={onNodesDelete} onConnect={onConnect} onNodeClick={(_, node) => { setSelectedNodeId(node.id); setMessage(`${node.data.title} selected.`); }} onPaneClick={() => setSelectedNodeId(null)} deleteKeyCode={["Backspace", "Delete"]} fitView fitViewOptions={{ padding: 0.25, maxZoom: 1.15 }} proOptions={{ hideAttribution: true }} className="bg-slate-50"><Background gap={24} size={1} /><Controls showInteractive={false} position="bottom-left" aria-label="Canvas controls" /></ReactFlow></section><section aria-label="Properties panel" className="min-w-0"><NodeConfigurationPanel node={selectedNode} onApply={applyConfig} /><div className="border-t border-slate-200 p-4"><div aria-live="polite" className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{message}</div>{selectedNode ? <button type="button" onClick={deleteSelected} className="mt-4 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Delete selected</button> : null}</div></section></div>
      <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">Server workflows are fetched through TanStack Query; local edits, history, revisions, and debounced autosave remain in the editor layer.</p>
    </div>
    {persisted ? <ExecutionPreview workflow={workflow} /> : null}
  </div>;
}

function WorkflowCanvasContainer({ workflowId }: { workflowId: string }) { const detail = useQuery({ queryKey: workflowQueryKeys.detail(workflowId), queryFn: () => fetchWorkflow(workflowId), retry: false }); if (detail.isPending) return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading workflow…</div>; if (detail.isError) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">{detail.error.message}</div>; return <CanvasEditor key={detail.data.id} initialWorkflow={detail.data} persisted />; }
export function WorkflowCanvas({ workflowId }: { workflowId?: string }) { return <ReactFlowProvider>{workflowId ? <WorkflowCanvasContainer workflowId={workflowId} /> : <CanvasEditor initialWorkflow={sampleWorkflow} persisted={false} />}</ReactFlowProvider>; }
