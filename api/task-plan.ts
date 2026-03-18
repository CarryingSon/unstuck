import OpenAI from 'openai';

type PlanDifficulty = 'Easy' | 'Medium' | 'Hard';

type TaskPlanStep = {
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: PlanDifficulty;
};

type TaskPlan = {
  title: string;
  summary: string;
  totalMinutes: number;
  steps: TaskPlanStep[];
};

type PlannerRequestBody = {
  taskText?: unknown;
  answers?: {
    deadline?: unknown;
    time?: unknown;
    materials?: unknown;
  };
};

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

const TASK_PLAN_JSON_SCHEMA = {
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

const parseModelJson = (rawText: string) => {
  const text = rawText.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const formatDeadline = (date: string, time: string) => {
  if (!date) return 'Not provided.';
  return time ? `${date} at ${time}` : date;
};

const toDifficulty = (value: unknown): PlanDifficulty => {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') return value;
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

const normalizeTaskPlan = (value: unknown): TaskPlan | null => {
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = (req.body ?? {}) as PlannerRequestBody;
    const taskText = String(body?.taskText ?? '').trim();
    const deadline = String(body?.answers?.deadline ?? '').trim();
    const time = String(body?.answers?.time ?? '').trim();
    const materials = String(body?.answers?.materials ?? '').trim() || 'Not specified';

    if (!taskText) {
      return res.status(400).json({ error: 'Task description is missing.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY is missing in Vercel environment variables.',
      });
    }

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

    const response = await client.responses.create({
      model,
      instructions:
        'You are an excellent AI mentor for breaking down tasks. Help the user get a clear, actionable plan.',
      input: [
        'Prepare a structured plan in English.',
        `Task description: ${taskText}`,
        `Due date: ${formatDeadline(deadline, time)}`,
        `Available materials: ${materials}`,
        'Return 3 to 8 steps.',
        'Steps should be in logical order, with realistic time estimates per step.',
        'Include time for final review/submission at the end.',
        'Respond with JSON only, without markdown fences.',
      ].join('\n'),
      max_output_tokens: 1200,
      text: {
        verbosity: 'low',
        format: {
          type: 'json_schema',
          name: 'task_plan',
          strict: true,
          schema: TASK_PLAN_JSON_SCHEMA,
        },
      },
    });

    const parsedJson = parseModelJson(response.output_text);
    const plan = normalizeTaskPlan(parsedJson);

    if (!plan) {
      return res.status(502).json({
        error: 'The model returned an invalid plan. Please try again.',
      });
    }

    return res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: error.message || 'OpenAI API error.',
      });
    }

    console.error('[api/task-plan] Unhandled server error:', error);
    return res.status(500).json({
      error: 'Unhandled API runtime error on Vercel.',
    });
  }
}
