import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Clock, CheckCircle2, ArrowRight, Play, GripHorizontal, Plus, Sparkles, Zap, MessageCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatMinutes, type TaskPlan, type PlanDifficulty } from '../../../shared/taskPlan.ts';
import { requestTaskPlan } from '../../lib/taskPlanner.ts';

const EDGE_DONE = '#22C55E';
const EDGE_ACTIVE = '#8B5CF6';
const EDGE_UPCOMING = '#DED4FF';
const DASHBOARD_STORAGE_PREFIX = 'unstuck.dashboard.v3.';

type QuestionsAnswers = {
  deadline: string;
  time?: string;
  materials: string;
};

type TaskNodeData = {
  id: number;
  title: string;
  desc: string;
  time: string;
  durationMinutes: number;
  status: 'done' | 'current' | 'upcoming';
  difficulty: PlanDifficulty;
  onTitleChange?: (id: string, newTitle: string) => void;
};

type PersistedDashboardState = {
  nodes: Node<TaskNodeData>[];
  edges: Edge[];
  summary: string;
  totalMinutes: number;
};

const FALLBACK_PLAN: TaskPlan = {
  title: 'Quick starter plan',
  summary: 'Break your task into small pieces so you can make immediate progress.',
  totalMinutes: 80,
  steps: [
    {
      title: 'Define the task goal clearly',
      description: 'Describe in one sentence what the final result should be.',
      durationMinutes: 10,
      difficulty: 'Easy',
    },
    {
      title: 'Gather materials in one place',
      description: 'Collect notes, links, and files into one list.',
      durationMinutes: 15,
      difficulty: 'Easy',
    },
    {
      title: 'Create a structure draft',
      description: 'Write key points without aiming for perfection.',
      durationMinutes: 25,
      difficulty: 'Medium',
    },
    {
      title: 'Final review and submission',
      description: 'Check requirements, revise, and submit the task.',
      durationMinutes: 30,
      difficulty: 'Medium',
    },
  ],
};

const difficultyLabel = (difficulty: PlanDifficulty) => {
  if (difficulty === 'Easy') return 'Easy';
  if (difficulty === 'Medium') return 'Medium';
  return 'Hard';
};

const styleForStatus = (status: TaskNodeData['status']) => {
  if (status === 'done') {
    return {
      edge: { stroke: EDGE_DONE, strokeWidth: 4 },
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed as const, color: EDGE_DONE },
    };
  }

  if (status === 'current') {
    return {
      edge: { stroke: EDGE_ACTIVE, strokeWidth: 4 },
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed as const, color: EDGE_ACTIVE },
    };
  }

  return {
    edge: { stroke: EDGE_UPCOMING, strokeWidth: 4, strokeDasharray: '8 8' },
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed as const, color: EDGE_UPCOMING },
  };
};

const sortNodesById = (left: Node<TaskNodeData>, right: Node<TaskNodeData>) =>
  Number(left.id) - Number(right.id);

const restyleEdgesForNodes = (nodes: Node<TaskNodeData>[], edges: Edge[]) => {
  const nodeStatusById = new Map(nodes.map((node) => [node.id, node.data.status] as const));

  return edges.map((edge) => {
    const sourceStatus = nodeStatusById.get(edge.source) ?? 'upcoming';
    const statusStyle = styleForStatus(sourceStatus);

    return {
      ...edge,
      animated: statusStyle.animated,
      style: statusStyle.edge,
      markerEnd: statusStyle.markerEnd,
    };
  });
};

const markCurrentStepAsDone = (nodes: Node<TaskNodeData>[]) => {
  if (!nodes.length) return nodes;

  const orderedNodes = [...nodes].sort(sortNodesById);
  const currentNode = orderedNodes.find((node) => node.data.status === 'current');
  if (!currentNode) return nodes;

  const nextNode = orderedNodes.find(
    (node) => Number(node.id) > Number(currentNode.id) && node.data.status !== 'done',
  );

  const withStatus = (
    node: Node<TaskNodeData>,
    status: TaskNodeData['status'],
  ): Node<TaskNodeData> => ({
    ...node,
    data: {
      ...node.data,
      status,
    },
  });

  return nodes.map((node) => {
    if (node.id === currentNode.id) {
      return withStatus(node, 'done');
    }

    if (nextNode && node.id === nextNode.id) {
      return withStatus(node, 'current');
    }

    if (node.id !== currentNode.id && node.data.status === 'current') {
      return withStatus(node, 'upcoming');
    }

    return node;
  });
};
const markCurrentStepAsDoneWithMeta = (nodes: Node<TaskNodeData>[]) => {
  if (!nodes.length) {
    return {
      nodes,
      completedNodeId: null as string | null,
      pathCompleted: false,
    };
  }

  const orderedNodes = [...nodes].sort(sortNodesById);
  const currentNode = orderedNodes.find((node) => node.data.status === 'current');
  if (!currentNode) {
    return {
      nodes,
      completedNodeId: null as string | null,
      pathCompleted: false,
    };
  }

  const updatedNodes = markCurrentStepAsDone(nodes);
  const pathCompleted = updatedNodes.length > 0 && updatedNodes.every((node) => node.data.status === 'done');

  return {
    nodes: updatedNodes,
    completedNodeId: currentNode.id,
    pathCompleted,
  };
};

const buildFlowFromPlan = (plan: TaskPlan) => {
  const nodes: Node<TaskNodeData>[] = plan.steps.map((step, index) => ({
    id: String(index + 1),
    type: 'task',
    position: {
      x: 80 + index * 390,
      y: index % 2 === 0 ? 180 : 40,
    },
    dragHandle: '.custom-drag-handle',
    data: {
      id: index + 1,
      title: step.title,
      desc: step.description,
      time: formatMinutes(step.durationMinutes),
      durationMinutes: step.durationMinutes,
      status: index === 0 ? 'current' : 'upcoming',
      difficulty: step.difficulty,
    },
  }));

  const edges: Edge[] = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const sourceNode = nodes[index];
    const targetNode = nodes[index + 1];
    const statusStyle = styleForStatus(sourceNode.data.status);
    edges.push({
      id: `e${sourceNode.id}-${targetNode.id}`,
      source: sourceNode.id,
      target: targetNode.id,
      type: 'smoothstep',
      animated: statusStyle.animated,
      style: statusStyle.edge,
      markerEnd: statusStyle.markerEnd,
    });
  }

  return { nodes, edges };
};

const readPersistedDashboardState = (storageKey: string): PersistedDashboardState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedDashboardState>;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;

    return {
      nodes: parsed.nodes as Node<TaskNodeData>[],
      edges: parsed.edges as Edge[],
      summary: String(parsed.summary ?? ''),
      totalMinutes: Number(parsed.totalMinutes ?? 0),
    };
  } catch {
    return null;
  }
};

const formatDeadline = (deadline: string, time?: string) => {
  if (!deadline) return 'Not set';

  const [year, month, day] = deadline.split('-').map(Number);
  if (!year || !month || !day) return deadline;

  const date = new Date(year, month - 1, day);
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return time ? `${dateLabel} ${time}` : dateLabel;
};

const TaskNode = ({ data, isConnectable }: { data: TaskNodeData; isConnectable: boolean }) => {
  const isCurrent = data.status === 'current';
  const isDone = data.status === 'done';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative w-72 rounded-3xl p-6 border-2 transition-all ${
        isCurrent
          ? 'bg-white border-primary shadow-lg ring-8 ring-primary/5'
          : isDone
            ? 'bg-emerald-50 border-emerald-300/80 opacity-95'
            : 'bg-white border-primary/10 hover:border-primary/30'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-primary border-4 border-white shadow-sm"
      />

      <div className="absolute top-3 right-3 text-primary/20 hover:text-primary cursor-grab active:cursor-grabbing custom-drag-handle">
        <GripHorizontal className="w-5 h-5" />
      </div>

      <div
        className={`absolute -top-5 -left-5 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md border-4 border-white z-10 ${
          isDone
            ? 'bg-emerald-500 text-white'
            : isCurrent
              ? 'bg-primary text-white'
              : 'bg-white text-primary/40 border-primary/10'
        }`}
      >
        {isDone ? (
          <div className="relative">
            <CheckCircle2 className="w-6 h-6" />
            <div className="absolute -top-4 -right-4 w-12 h-12 pointer-events-none">
              <div className="sparkle absolute top-0 left-0 w-2 h-2 bg-emerald-500 rounded-full" />
              <div
                className="sparkle absolute top-2 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full"
                style={{ animationDelay: '0.5s' }}
              />
              <div
                className="sparkle absolute bottom-0 left-2 w-2 h-2 bg-emerald-300 rounded-full"
                style={{ animationDelay: '1s' }}
              />
            </div>
          </div>
        ) : (
          data.id
        )}
      </div>

      {isCurrent && (
        <div className="absolute -top-4 right-6 bg-accent text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1.5">
          <Play className="w-3 h-3 fill-current" /> Focus Mode
        </div>
      )}

      <div className="mb-4 mt-3">
        <input
          value={data.title}
          onChange={(event) => data.onTitleChange?.(String(data.id), event.target.value)}
          className={`w-full font-display font-bold text-lg leading-tight mb-2 bg-transparent focus:outline-none rounded px-1 -ml-1 ${
            isCurrent ? 'text-ink' : 'text-ink/80'
          }`}
        />
        <p className="text-ink/50 text-sm leading-relaxed">{data.desc}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-primary/5">
        <span className="text-primary font-bold text-xs flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5" /> {data.time}
        </span>
        <span
          className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
            data.difficulty === 'Easy'
              ? 'bg-primary/10 text-primary'
              : data.difficulty === 'Medium'
                ? 'bg-secondary/30 text-accent'
                : 'bg-accent/15 text-accent'
          }`}
        >
          {difficultyLabel(data.difficulty)}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-4 h-4 bg-primary border-4 border-white shadow-sm"
      />
    </motion.div>
  );
};

const nodeTypes = {
  task: TaskNode,
};

export function DashboardScreen({
  activeTaskId,
  onStart,
  taskText,
  answers,
  plannedTask,
  planningError,
  onNewTask,
  pendingCompletions,
  onConsumeCompletion,
  onStepCompleted,
  onTaskPathCompleted,
}: {
  activeTaskId: string;
  onStart: () => void;
  taskText: string;
  answers: QuestionsAnswers;
  plannedTask: TaskPlan | null;
  planningError?: string;
  onNewTask?: () => void;
  pendingCompletions: number;
  onConsumeCompletion: () => void;
  onStepCompleted?: (stepId: string) => void;
  onTaskPathCompleted?: () => void;
}) {
  const storageKey = useMemo(
    () => `${DASHBOARD_STORAGE_PREFIX}${activeTaskId}`,
    [activeTaskId],
  );
  const persistedDashboard = useMemo(
    () => readPersistedDashboardState(storageKey),
    [storageKey],
  );
  const fallbackFlow = useMemo(() => buildFlowFromPlan(FALLBACK_PLAN), []);
  const initialFlow = useMemo(() => buildFlowFromPlan(plannedTask ?? FALLBACK_PLAN), [plannedTask]);

  const [nodes, setNodes] = useState<Node<TaskNodeData>[]>(
    persistedDashboard?.nodes ?? initialFlow.nodes,
  );
  const [edges, setEdges] = useState<Edge[]>(persistedDashboard?.edges ?? initialFlow.edges);
  const [summary, setSummary] = useState(
    persistedDashboard?.summary || plannedTask?.summary || FALLBACK_PLAN.summary,
  );
  const [estimatedTotalMinutes, setEstimatedTotalMinutes] = useState(
    persistedDashboard?.totalMinutes || plannedTask?.totalMinutes || FALLBACK_PLAN.totalMinutes,
  );
  const [hydratedTaskId, setHydratedTaskId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (persistedDashboard) {
      setNodes(persistedDashboard.nodes);
      setEdges(persistedDashboard.edges);
      setSummary(persistedDashboard.summary || FALLBACK_PLAN.summary);
      setEstimatedTotalMinutes(persistedDashboard.totalMinutes || FALLBACK_PLAN.totalMinutes);
      setHydratedTaskId(activeTaskId);
      setAiError('');
      return;
    }

    if (plannedTask) {
      const flow = buildFlowFromPlan(plannedTask);
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setSummary(plannedTask.summary);
      setEstimatedTotalMinutes(plannedTask.totalMinutes);
      setHydratedTaskId(activeTaskId);
      setAiError('');
      return;
    }

    setNodes(fallbackFlow.nodes);
    setEdges(fallbackFlow.edges);
    setSummary(FALLBACK_PLAN.summary);
    setEstimatedTotalMinutes(FALLBACK_PLAN.totalMinutes);
    setHydratedTaskId(activeTaskId);
    setAiError('');
  }, [activeTaskId, fallbackFlow, persistedDashboard, plannedTask]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hydratedTaskId !== activeTaskId) return;

    const payload: PersistedDashboardState = {
      nodes,
      edges,
      summary,
      totalMinutes: estimatedTotalMinutes,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [activeTaskId, edges, estimatedTotalMinutes, hydratedTaskId, nodes, storageKey, summary]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((currentNodes) => applyNodeChanges(changes, currentNodes)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges)),
    [],
  );

  const handleTitleChange = useCallback((id: string, newTitle: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, title: newTitle } } : node,
      ),
    );
  }, []);

  const addTaskNode = useCallback(() => {
    setNodes((currentNodes) => {
      if (!currentNodes.length) return currentNodes;
      const sorted = [...currentNodes].sort(sortNodesById);
      const last = sorted[sorted.length - 1];
      const nextId = String(Number(last.id) + 1);

      const nextNode: Node<TaskNodeData> = {
        id: nextId,
        type: 'task',
        position: {
          x: last.position.x + 380,
          y: last.position.y === 180 ? 40 : 180,
        },
        dragHandle: '.custom-drag-handle',
        data: {
          id: Number(nextId),
          title: 'New step',
          desc: 'Add details for this step.',
          time: formatMinutes(15),
          durationMinutes: 15,
          status: 'upcoming',
          difficulty: 'Easy',
        },
      };

      const statusStyle = styleForStatus(last.data.status);
      setEdges((currentEdges) => [
        ...currentEdges,
        {
          id: `e${last.id}-${nextId}`,
          source: last.id,
          target: nextId,
          type: 'smoothstep',
          animated: statusStyle.animated,
          style: statusStyle.edge,
          markerEnd: statusStyle.markerEnd,
        },
      ]);

      return [...currentNodes, nextNode];
    });
  }, []);

  const breakTaskWithAi = useCallback(async () => {
    setIsGenerating(true);
    setAiError('');

    try {
      const plan = await requestTaskPlan({ taskText, answers });

      const flow = buildFlowFromPlan(plan);
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setSummary(plan.summary);
      setEstimatedTotalMinutes(plan.totalMinutes);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unknown error while generating the plan.');
    } finally {
      setIsGenerating(false);
    }
  }, [answers, taskText]);

  useEffect(() => {
    if (!planningError) return;
    setAiError(planningError);
  }, [planningError]);

  useEffect(() => {
    if (pendingCompletions <= 0) return;

    const completion = markCurrentStepAsDoneWithMeta(nodesRef.current);
    setNodes(completion.nodes);
    setEdges((currentEdges) => restyleEdgesForNodes(completion.nodes, currentEdges));

    if (completion.completedNodeId) {
      onStepCompleted?.(completion.completedNodeId);
    }

    if (completion.pathCompleted) {
      onTaskPathCompleted?.();
    }

    onConsumeCompletion();
  }, [onConsumeCompletion, onStepCompleted, onTaskPathCompleted, pendingCompletions]);

  const dueLabel = formatDeadline(answers.deadline, answers.time);
  const currentStep = nodes.find((node) => node.data.status === 'current');
  const computedTotalMinutes = nodes.reduce(
    (sum, node) => sum + Math.max(0, Number(node.data.durationMinutes || 0)),
    0,
  );
  const totalMinutes = Math.max(estimatedTotalMinutes, computedTotalMinutes);
  const doneCount = nodes.filter((node) => node.data.status === 'done').length;
  const progressPercent = nodes.length ? Math.round((doneCount / nodes.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-bg overflow-hidden">
      <div className="bg-surface px-10 py-8 border-b border-primary/10 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-bold text-ink">
                  Plan for: {taskText ? taskText.slice(0, 45) + (taskText.length > 45 ? '...' : '') : 'Your task'}
                </h1>
                <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-[10px] font-black uppercase tracking-widest">
                  AI Plan
                </span>
              </div>
              <p className="text-ink/50 font-medium flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                "Materials: {answers.materials || 'not provided'}. Due: {dueLabel}."
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4 min-w-[240px]">
            <div className="w-full">
              <div className="flex justify-between text-xs font-bold text-ink/40 mb-2 uppercase tracking-widest">
                <span>Progress</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="w-full h-4 bg-primary/10 rounded-full overflow-hidden p-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-ink/60">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" /> ~{formatMinutes(totalMinutes)}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
              <span>Due: {dueLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-surface-soft">
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              onTitleChange: handleTitleChange,
            },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="w-full h-full"
        >
          <Background color={EDGE_DONE} gap={40} size={1} opacity={0.12} />
          <Controls className="!bg-surface !border-primary/10 !shadow-xl !rounded-2xl !overflow-hidden" />
        </ReactFlow>

        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          className="absolute top-8 right-8 w-80 glass-card rounded-[2.5rem] p-8 soft-shadow z-10 border-primary/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <h3 className="font-display font-bold text-ink text-lg">AI Guide</h3>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">
                Summary
              </h4>
              <p className="text-sm text-ink/70 leading-relaxed font-medium">{summary}</p>
            </div>

            <div className="bg-primary/10 rounded-2xl p-5 border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                Next step
              </h4>
              <p className="font-bold text-ink mb-1">{currentStep?.data.title || 'Set your first step'}</p>
              <p className="text-xs text-ink/50 font-medium">
                Estimated time: {currentStep?.data.time || formatMinutes(15)}
              </p>
            </div>

            {aiError && <p className="text-sm text-accent font-semibold">{aiError}</p>}

            <motion.button
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: isGenerating ? 1 : 0.98 }}
              onClick={onStart}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Start this step <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <div className="bg-surface px-10 py-6 border-t border-primary/10 flex justify-center items-center gap-6 shrink-0 relative z-10">
        <button
          onClick={addTaskNode}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-bg text-ink/60 font-bold hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/10"
        >
          <Plus className="w-5 h-5" /> Add Task
        </button>
        <button
          onClick={() => {
            void breakTaskWithAi();
          }}
          disabled={isGenerating}
          className="flex items-center gap-2.5 px-8 py-4 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> AI is preparing a plan...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 fill-white/20" /> Break Task with AI
            </>
          )}
        </button>
        <button
          onClick={onStart}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-bg text-ink/60 font-bold hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/10"
        >
          <Zap className="w-5 h-5" /> Start Focus Mode
        </button>
        <button
          onClick={onNewTask}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-bg text-ink/60 font-bold hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/10"
        >
          <Plus className="w-5 h-5" /> New Task
        </button>
      </div>
    </div>
  );
}
