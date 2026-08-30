"use client";

import { Handle, Position as FlowPosition } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode, CanvasNodeData } from "@/lib/workflow/react-flow-adapter";

const tone: Record<CanvasNodeData["nodeType"], string> = { trigger: "border-emerald-300 bg-emerald-50", action: "border-blue-300 bg-blue-50", condition: "border-amber-300 bg-amber-50", notification: "border-violet-300 bg-violet-50", end: "border-slate-300 bg-slate-100" };
const labels: Record<CanvasNodeData["nodeType"], string> = { trigger: "Workflow trigger", action: "Workflow action", condition: "Workflow condition", notification: "Workflow notification", end: "Workflow end" };
function Frame({ node, children }: { node: CanvasNode; children: React.ReactNode }) { return <div role="group" aria-label={labels[node.data.nodeType]} className={`relative min-h-24 w-52 rounded-xl border-2 px-4 py-3 shadow-sm ${tone[node.data.nodeType]}`}>{children}</div>; }
function Header({ node }: { node: CanvasNode }) { return <><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{node.data.title}</p><p className="mt-1 text-sm font-semibold text-slate-900">{node.data.summary}</p></>; }
export function TriggerNode({ data }: NodeProps<CanvasNode>) { return <Frame node={{ data } as CanvasNode}><Header node={{ data } as CanvasNode} /><Handle type="source" position={FlowPosition.Right} id="default" aria-label="Trigger output" /></Frame>; }
export function ActionNode({ data }: NodeProps<CanvasNode>) { return <Frame node={{ data } as CanvasNode}><Handle type="target" position={FlowPosition.Left} id="default" aria-label="Action input" /><Header node={{ data } as CanvasNode} /><Handle type="source" position={FlowPosition.Right} id="default" aria-label="Action output" /></Frame>; }
export function ConditionNode({ data }: NodeProps<CanvasNode>) { return <Frame node={{ data } as CanvasNode}><Handle type="target" position={FlowPosition.Left} id="default" aria-label="Condition input" /><Header node={{ data } as CanvasNode} /><Handle type="source" position={FlowPosition.Right} id="true" style={{ top: "38%" }} aria-label="Condition true output" /><Handle type="source" position={FlowPosition.Right} id="false" style={{ top: "68%" }} aria-label="Condition false output" /></Frame>; }
export function NotificationNode({ data }: NodeProps<CanvasNode>) { return <Frame node={{ data } as CanvasNode}><Handle type="target" position={FlowPosition.Left} id="default" aria-label="Notification input" /><Header node={{ data } as CanvasNode} /><Handle type="source" position={FlowPosition.Right} id="default" aria-label="Notification output" /></Frame>; }
export function EndNode({ data }: NodeProps<CanvasNode>) { return <Frame node={{ data } as CanvasNode}><Handle type="target" position={FlowPosition.Left} id="default" aria-label="End input" /><Header node={{ data } as CanvasNode} /></Frame>; }
