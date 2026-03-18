import OpenAI from 'openai';
import { normalizeTaskPlan, TASK_PLAN_JSON_SCHEMA, type TaskPlan } from '../shared/taskPlan.ts';

export type PlannerRequestBody = {
  taskText?: unknown;
  answers?: {
    deadline?: unknown;
    time?: unknown;
    materials?: unknown;
  };
};

type CreateTaskPlanInput = {
  body: PlannerRequestBody;
  apiKey?: string;
  model?: string;
};

export class PlannerServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'PlannerServiceError';
    this.status = status;
    this.details = details;
  }
}

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

export const createTaskPlan = async ({
  body,
  apiKey,
  model,
}: CreateTaskPlanInput): Promise<TaskPlan> => {
  const taskText = String(body?.taskText ?? '').trim();
  const deadline = String(body?.answers?.deadline ?? '').trim();
  const time = String(body?.answers?.time ?? '').trim();
  const materials = String(body?.answers?.materials ?? '').trim() || 'Not specified';

  if (!taskText) {
    throw new PlannerServiceError(400, 'Task description is missing.');
  }

  if (!apiKey) {
    throw new PlannerServiceError(
      500,
      'OPENAI_API_KEY is missing in the environment. Add it to your Vercel project settings.'
    );
  }

  try {
    const client = new OpenAI({ apiKey });
    const selectedModel = model || 'gpt-5-mini';

    const response = await client.responses.create({
      model: selectedModel,
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
      throw new PlannerServiceError(502, 'The model returned an invalid plan. Please try again.', {
        raw: response.output_text,
      });
    }

    return plan;
  } catch (error) {
    if (error instanceof PlannerServiceError) {
      throw error;
    }

    if (error instanceof OpenAI.APIError) {
      throw new PlannerServiceError(error.status || 500, error.message || 'OpenAI API error.');
    }

    throw new PlannerServiceError(500, 'Unknown error while generating the plan.');
  }
};
