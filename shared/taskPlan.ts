export type PlanDifficulty = 'Easy' | 'Medium' | 'Hard';

export type TaskPlanStep = {
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: PlanDifficulty;
};

export type TaskPlan = {
  title: string;
  summary: string;
  totalMinutes: number;
  steps: TaskPlanStep[];
};

export const TASK_PLAN_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'totalMinutes', 'steps'],
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 120 },
    summary: { type: 'string', minLength: 10, maxLength: 400 },
    totalMinutes: { type: 'integer', minimum: 5, maximum: 1440 },
    steps: {
      type: 'array',
      minItems: 3,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'description', 'durationMinutes', 'difficulty'],
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 120 },
          description: { type: 'string', minLength: 10, maxLength: 300 },
          durationMinutes: { type: 'integer', minimum: 5, maximum: 240 },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard'],
          },
        },
      },
    },
  },
} as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const toDifficulty = (value: unknown): PlanDifficulty => {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') {
    return value;
  }

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (normalized === 'easy') return 'Easy';
  if (normalized === 'medium') return 'Medium';
  return 'Hard';
};

const toStep = (value: unknown): TaskPlanStep | null => {
  if (!value || typeof value !== 'object') return null;
  const step = value as Record<string, unknown>;
  const title = String(step.title ?? '').trim();
  const description = String(step.description ?? '').trim();
  const durationRaw = Number(step.durationMinutes);

  if (!title || !description || !Number.isFinite(durationRaw)) return null;

  return {
    title,
    description,
    durationMinutes: clamp(Math.round(durationRaw), 5, 240),
    difficulty: toDifficulty(step.difficulty),
  };
};

export const normalizeTaskPlan = (value: unknown): TaskPlan | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((item) => toStep(item))
    .filter((item): item is TaskPlanStep => item !== null);

  if (!steps.length) return null;

  const title = String(raw.title ?? '').trim() || 'Task plan';
  const summary =
    String(raw.summary ?? '').trim() || 'Plan generated from your task and deadline details.';
  const fallbackTotal = steps.reduce((sum, step) => sum + step.durationMinutes, 0);
  const providedTotal = Number(raw.totalMinutes);
  const totalMinutes = Number.isFinite(providedTotal) ? Math.round(providedTotal) : fallbackTotal;

  return {
    title,
    summary,
    totalMinutes: clamp(totalMinutes, 5, 1440),
    steps,
  };
};

export const formatMinutes = (minutes: number) => {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
};
